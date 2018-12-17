var CryptoJS = require('crypto-js');
var WebSocket = require('ws');

function hashKey(key) {
    return CryptoJS.SHA1(key).toString(); // 160 bit => hash is hex number
}

function less_than(low, high) {
    let low_length = low.length;
    let high_length = high.length;
    console.log(low, high, low_length, high_length)
    if(low_length !== high_length) {

        return low_length < high_length;
    }

    for(let i = 0; i < low_length; i++) {
        if(low[i] < high[i]) {
            return true;
        } else if(low[i] > high[i]) {
            return false;
        }
    }
    return false;
}

function equal_to(a, b) {
    let a_length = a.length;
    let b_length = b.length;

    if(a_length !== b.length) {
        return false;
    }

    for(let i = 0; i < a_length; i++) {
        if(a[i] !== b[i]) {
            return false;
        }
    }
    return true;
} 

function less_than_or_equal(low, high) {
    if (low.length !== high.length) {
        // Arbitrary comparison
        return low.length <= high.length;
    }

    for (var i = 0; i < low.length; ++i) {
        if (low[i] < high[i]) {
            return true;
        } else if (low[i] > high[i]) {
            return false;
        }
    }

    return true;
}

var FOUND_SUCCESSOR = 'FOUND_SUCCESSOR';
var FIND_SUCCESSOR = 'FIND_SUCCESSOR';
var NOTIFY_SUCCESSOR = 'NOTIFY_SUCCESSOR';

function Node(ipaddr, portNumber) {
    var ipaddress = ipaddr || '127.0.0.1';
    var port = portNumber || 6969;
    var id = hashKey(ipaddress + port).slice(-4);
    var _self = { id : id, ipaddress: ipaddress, port: port }
    var successor = _self;
    var predecessor = null;
    var finger_table = []; // routing table . map to ipaddress of next node
    //Size of routing tables is logarithmic.:
    //  Routing table size: M, where N = 2^M.
    // • Every node n knows 
    // successor(n + 2^(i­1)) 
    // for i = 1... M
    //Routing entries = log2(N)
    var data = {};


    function closestPrecedingNode(id) {
        for(let i = finger_table.length - 1; i >= 0 ; i++) {
            if(finger_table[i] 
                && (less_than (id, finger_table[i].id) 
                && less_than_or_equal(finger_table[i].id, id)) ) //finger[i] ∈(n, id) 
            {
                return finger_table[i];
            }
        }
        if(less_than(id, successor.id) 
           && less_than_or_equal(successor.id, id) ) // successor.id ∈(n, id)
        {   
            console.log('successor', id);
            return successor;
        } else {
            console.log('self', id);
            return _self;
        }
    }

    _self.store = function(id, value) {
        data[id] = value;
    }

    _self.retrieve = function(id) {
        return data[id];
    }

    _self.find_successor = function(find_ID) {
        // predecessor !== nil && predecessor < id <= n 
        if( predecessor !== null && 
            ( less_than(predecessor, find_ID) && 
              less_than_or_equal(find_ID, id) ) ) {
            return { successor: _self, type: FOUND_SUCCESSOR };
        } else if( less_than(id, find_ID) && less_than_or_equal(find_ID, successor.id) ) { // (id ∈(n, successor])
            return { successor: successor, type: FOUND_SUCCESSOR };
        } else {
            let m = closestPrecedingNode(id);
            return { successor: m, type: FIND_SUCCESSOR };
        }
    }

    var join_retry;
    _self.join = function(remote) {
        predecessor = null;
        function try_to_join() {
            return { type: FIND_SUCCESSOR, id: id };
        }
        join_retry = setInterval(try_to_join, 2000).unref();
        try_to_join();
    }

    _self.put = function(id, value) {
        let s = _self.find_successor(id);
        s.store(id, value);
    }

    _self.get = function(id) {
        let s = _self.find_successor(id);
        s.retrieve(id);
    }

    return _self;
}


exports.Chord = function Chord(ipaddress, port) {
    var server = new WebSocket.Server({ port: port, host: ipaddress });
    var node = Node(ipaddress, port);
    console.log('node join', node);
    console.log('-----------------------------------------------------')
    console.log("try to join", node.find_successor(hashKey(ipaddress + 6968).slice(-4)));

}

exports.masterNode = function noderoot(ipaddress, port) {
    var server = new WebSocket.Server({ port: port, host: ipaddress });
    var node = Node(ipaddress, port);
    console.log('Master node', node);
}

function initErrorHandler(ws) {
    function closeConnection(ws) {
        console.log('ws disconnected ', ws._socket.remotePort);
    }

    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
}

function test() {
    for(let i = 6969; i < 6971; i++) {
        console.log("================================================================")
        exports.Chord('192.168.1.210', i);
    }

    exports.masterNode('192.168.1.210', 6968);
}

test()