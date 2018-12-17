var ChordUtils = {
    DebugNodeJoin: process.env.NODE_ENV === 'PRODUCTION' ? false: true,
    DebugFixFingers: process.env.NODE_ENV === 'PRODUCTION' ? false: true,

    isInRange: function(key, left, right) {
		if (ChordUtils.DebugFixFingers)
			console.info(key + ' isInRange [ ' + left + ', ' + right + ']')
		
		if (left < right) {
			return (key > left && key < right);
		} else {
			return (key > right && key < left);
		}
    },
    
    getNextFingerId: function(n, i, m) {
		var result = n + Math.pow(2, i - 1);
		var result = result % Math.pow(2, m);

		return result;
    },
    
    getFixFingerId: function(key, exponent) {
	    var result = key.split('');
	    var index = result.length - 1;
	    var carry = Math.pow(2, exponent);

	    while (index >= 0) {
	        var d = parseInt(result[index], 16) + carry;
	        carry = 0;
	        if (d > 0xf) {
	            carry = d - (d % 16);
	            carry = carry / 16;

	            d = d % 16;       
	        }
	        result[index] = d.toString(16);        
	        --index;
	    }
	    return result.join('');
	},
}

var Chord = {
    NOTIFY_PREDECESSOR: process.env.NODE_ENV === 'PRODUCTION' ? 0 : 'NOTIFY_PREDECESSOR',
    NOTIFY_SUCCESSOR: process.env.NODE_ENV === 'PRODUCTION' ? 1 : 'NOTIFY_SUCCESSOR',
    NOTIFY_JOIN: process.env.NODE_ENV === 'PRODUCTION' ? 2 : 'NOTIFY_JOIN',
    FIND_SUCCESSOR: process.env.NODE_ENV === 'PRODUCTION' ? 3 : 'FIND_SUCCESSOR',
    FOUND_SUCCESSOR: process.env.NODE_ENV === 'PRODUCTION' ? 4 : 'FOUND_SUCCESSOR',
    MESSAGE: process.env.NODE_ENV === 'PRODUCTION' ? 5 : 'MESSAGE',
};

function Node(id, server) {
    this.id = id;
    this.address = server.host;
    this.port = server.port;

    this.server = server;

    this._self = {
        id: this.id,
        address: this.address,
        port: this.port,
    }
    // each node entries to 8 other node
    this.finger_entries = 8;

    //create new chord ring
    this.predecessor = null;
    this.successor = this._self;


    // Initialize finger table
    this.fingers = [];
    this.fingers.length = 0;

    this.next_finger = 0;

    console.info('node id = '+ this.id);
    console.info('successor = ' + JSON.stringify(this.successor));
}


Node.prototype.startUpdateFingers = function() {
    var fix_fingers = function() {
        var fixFingerId = '';
        var next = this.next_finger;

        if(next >= this.finger_entries) {
            next = 0;
        }

        fixFingerId = ChordUtils.getFixFingerId(this.id, next);
        this.next_finger = next + 1;

        // n.fix_fingers()
        this.send(this._self, { 
            type: Chord.FIND_SUCCESSOR, 
            id: fixFingerId,
            next: next
        });

         // Print finger table, predecessor and successor
        if (ChordUtils.DebugFixFingers) {
            var dataset = [];

            console.info('getFixFingerId = ' + fixFingerId);
            console.info('finger table length = '+ this.fingers.length);

            for (var i = this.fingers.length - 1; i >= 0; --i) {
                dataset.push({
                    next: i,
                    key: this.fingers[i].key,                
                    successor: this.fingers[i].successor.id
                });
            }
            console.table(dataset);

            console.log('----------------------');
            console.log('successor: ' + JSON.stringify(this.successor));
            console.log('predecessor: ' + JSON.stringify(this.predecessor));
            console.log('----------------------');            
        }
    }

    // Stabilize
    setInterval(function stabilize() {
        this.send(this.successor, { type: Chord.NOTIFY_PREDECESSOR });
    }.bind(this), 2500).unref();

    setInterval(fix_fingers.bind(this), 2000).unref();
}

Node.prototype.send = function(from, message, to) {
    if (typeof to === 'undefined') {
        to = from;
        from = this._self;
    }

    if (typeof message.id === 'undefined') {
        message.id = this.id;
    }

    var packet = {
        from: {
            address: from.address,
            port: from.port,
            id: from.id
        },
        message: message
    };

    return this.server.sendChordMessage(to, packet);
}


Node.prototype.join = function(remote) {
    var message = {
        type: Chord.NOTIFY_JOIN
    };

    this.predecessor = null;

    if (ChordUtils.DebugNodeJoin)
        console.info('try to join ' + JSON.stringify(remote));

    // Join
    this.send(remote, message);

    return true;
}

Node.prototype.closet_finger_preceding = function(find_id) { 
     /*
     * n.closest_preceding_node(id)
     *   for i = m downto 1
     *     if (finger[i]∈(n,id))
     *       return finger[i];
     *   return n;
     */

    for (var i = this.fingers.length - 1; i >= 0; --i) {
        if (this.fingers[i] && ChordUtils.isInRange(this.fingers[i].successor.id, this.id, find_id)) {
            return this.fingers[i].successor;
        }
    }

    if (ChordUtils.isInRange(this.successor.id, this.id, find_id)) {
        return this.successor;
    }

    return this._self;
}

Node.prototype.dispatch = function(_from, _message) {
    var from = _from;
    var message = _message;

    //examples : RING CHORD have NODE(1) vs NODE(5) 
    // NODE(5) is successor of NODE(1). NODE(1) is predecessor of NODE(5)
    // What will happen when NODE(3) join to the RING CHORD
    switch(message.type) {
        //N notifies its successor for predecessor
        case NOTIFY_PREDECESSOR:
            /*
             * predecessor is nil or n'∈(predecessor, n)
             *  NODE(5) received message.......
             *  this.id = 5, this.predecessor.id = 1, from.id = 3
             *  => predecessor of 5 = 3...... update
             *  notify to NODE(3) update SUCCESSOR 
             */
            
            if (this.predecessor === null
                || ChordUtils.isInRange(from.id, this.predecessor.id, this.id)) {
                this.predecessor = from;

                console.info('new predecessor is now = ' + this.predecessor.id);
            }
            
            message.type = Chord.NOTIFY_SUCCESSOR;

            this.send(this.predecessor, message, from);

            break; 
        // Stabilize()
        case Chord.NOTIFY_SUCCESSOR:
            /*  
             *  n.stabilize() 
             *    x = successor.predecessor; 
             *    if (x∈(n, successor)) 
             *      successor = x;
             *    successor.notify(n);
             *  NODE(1) received message.....
             *  1 = this.id from.id=3 this.successor.id=5
             *  => successor of 1 = 3 .....update
             */      
            if (ChordUtils.isInRange(from.id, this.id, this.successor.id)) {
                this.successor = from;

                console.info('NOTIFY_SUCCESSOR: new successor is now = ' + this.successor.id);
            }

            break;    
        
        
    }
}

module.exports = Node;

