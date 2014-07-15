angular.module('KoKaRo').factory('Board', ['Players', function(Players){
	return {
		board: [],
		defaultBoard: [
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' ']
		],
		extends: function (i, j){
			var board = this.board;
			if (i === 0 || i === board.length-1) {
				var row = [];
				for (var k = board[0].length - 1; k >= 0; k--) {
					row.push(' ');
				};
				if (i === 0) {
					board.unshift(row);
					i++;
				} else board.push(row);
			}

			if (j === 0) {
				for (var k = board.length - 1; k >= 0; k--) {
					board[k].unshift(' ');
				};
				j++;
			} else if (j === board[0].length-1) {
				for (var k = board.length - 1; k >= 0; k--) {
					board[k].push(' ');
				};
			}
			return {i:i,j:j};
		},
		checkGameOver: function (i, j){
			var board = this.board,
				line1 = [],
				line2 = [],
				line3 = [],
				line4 = [];

			var h = j - 4;
			for (var k = i - 4; k <= i + 4; k++) {
				line1.push(board[i][h]||' ');
			 	if (board[k]) {
			 		line2.push(board[k][j]);
			 		line3.push(board[k][h]||' ');
			 		line4.push(board[k][2*j-h]||' ');
				} else {
					line2.push(' ');
					line3.push(' ');
					line4.push(' ');
				}
				h++;
			};
			var check = line1.concat(['|'], line2, ['|'], line3, ['|'], line4).join('');
			if (Players.testWin.test(check)) return player;
			else if (Players.testLose.test(check)) return player^1;
			else return -1;
		},
		cellIsEmpty: function(i,j){
			return this.board[i][j]===' ';
		},
		play: function(i, j) {
			this.board[i][j] = Players.signs[Players.player];
			return this.extends(i,j);
		}
	}
}]);