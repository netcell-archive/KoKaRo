angular.module('KoKaRo').factory('Players', [function(){
	var testWinRegExp = [
		/XXXXX| XXXX /,
		/OOOOO| OOOO /
	];
	return {
		player: null,
		testWin: null,
		testLose: null,
		signs: ['X','O'],
		joinAs: function(room, sign){
			console.log(sign);
			this.player = player = sign;
			room.$child('player'+sign).$set('true');
			this.testWin = testWinRegExp[sign];
			this.testLose = testWinRegExp[sign^1];
			if (sign===0) room.$child('turn').$set(0);
		},
		join: function(room){
			/* Join the room if a slot is opened */
			if (!room.player0)		this.joinAs(room, 0)
			else if (!room.player1) this.joinAs(room, 1)
			/* Create a new room if the room is full */
			else return false;
			return true;
		},
		cellIsEnemy: function(cell){
			return this.signs[this.player] !== cell;
		}
	}
}]);