angular
.module('KoKaRo', ['ngRoute','firebase','ngTouch'])
.config(['$routeProvider',function($routeProvider) {
	$routeProvider.
		when('/', {
			templateUrl: 'board.html',
			controller: 'mainAppCtrl'
		}).
		when('/:roomId', {
			templateUrl: 'board.html',
			controller: 'mainAppCtrl'
		}).
		otherwise({
			redirectTo: '/'
		});
}])
.controller('mainAppCtrl', [
	'$scope', 
	'$firebase', 
	'$routeParams', 
	'$location', 
	function($scope, $firebase, $routeParams, $location){

	/*------------------------*/
	/*----- ROOM HELPERS -----*/
	/*------------------------*/

	$scope.shareLink = function(){
		return 'https://www.facebook.com/sharer/sharer.php?u='+$location.absUrl().replace('#','%23');
	};

	/* Create a random room */
	$scope.newRoom = function(){
		/* Make a random token */
		var token = Array.apply(0, Array(5)).map(function() {
		    return (function(charset){
		        return charset.charAt(Math.floor(Math.random() * charset.length))
		    }('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'));
		}).join('');
		/* Connect to the room by changing the route */
		$location.path('/'+token);
	};

	/* Room navigating */
	$scope.goToRoom = function(roomId){
		/* Connect to the room by changing the route */
		if ($routeParams.roomId!==roomId) $location.path('/'+roomId);
	};

		/* Player sign */
	var signs = ['X','O'];

	/* Join a room with specified sign */
	function joinAs(room, sign){
		/* Local reassignments */
		$scope.player = sign;
		/* Taking the slot */
		room.$child('player'+sign).$set('true');
		/* Taking turn */
		if (sign===0) room.$child('turn').$set(0);
	}

		/* Initial board */
	var defaultBoard = [
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' '],
			[' ',' ',' ',' ',' ']
		], 
		/* Default room properties */
		reset = {
			board: defaultBoard,
			winner: false,
			justPlayed: false
		};

	/* Reset the game using the same room*/
	$scope.newGame = function(room){
		/* Default to $scope.room */
		room = room || $scope.room;
		/* Give the winner the turn */
		reset.turn = signs.indexOf(room.winner);
		/* Reset the room to default properties */
		room.$update(reset);
	};

	/* Create a room by default */
	if (!$routeParams.roomId) $scope.newRoom();
	/* unless a room id is specified */
	else {
		/* Connect to the room */
		var room = $firebase(new Firebase(
			"https://kokaro.firebaseio.com/room/"+
			$routeParams.roomId
		)).$on('loaded', function(){
			/* Join the room if a slot is opened */
			if (!room.player0)		joinAs(room, 0)
			else if (!room.player1) joinAs(room, 1)
			/* Create a new room if the room is full */
			else return $scope.newRoom();
			/* If it's a new room, populate a board */
			if (!room.board) room.$update({
				board: defaultBoard
			});
			/* Expose to the scope */
			$scope.room = room;
			$scope.roomId = $routeParams.roomId;
		});
	}

	/*---------------------------*/
	/*----- STYLING HELPERS -----*/
	/*---------------------------*/

	/* Check if the current cell is just played */
	$scope.isJustPlayed = function(i, j) {
		if ($scope.room.justPlayed){
			var justPlayed = $scope.room.justPlayed;
			return justPlayed.i===i && justPlayed.j===j;
		} else return false;
	};

	/* Check if the current cell is played by the enemy */
	$scope.cellIsEnemy = function(cell){
		return signs[$scope.player] !== cell;
	};

	/* Update the container size as the board extends */
	$scope.boardWidth = function(){
		if ($scope.room && $scope.room.board && $scope.room.board[0] && $scope.room.board[0].length) {
			// board width * cell width
			return $scope.room.board[0].length*60;
		} else return 0; // Default value
	};

	$scope.onTurn = function(){
		if ($scope.room.winner) return $scope.haveWon();
		else return $scope.room.turn === $scope.player;
	};

	$scope.haveWon = function(){
		return $scope.room.winner === signs[$scope.player];
	};

	/*---------------------------------*/
	/*----- BOARD FUNCTIONALITIES -----*/
	/*---------------------------------*/

	/* Extend the board if played near the border 
	** RETURN the new cordinate of the just played cell */
	function extendBoard(i, j){
		/* Alias */
		var board = $scope.room.board;
		/* Extending vertically 
		** if played on top or bottom row */
		if (i === 0 || i === board.length-1) {
			var row = [];
			/* Create a new line */
			for (var k = board[0].length - 1; k >= 0; k--) {
				row.push(' ');
			};
			/* and add into the board */
			if (i === 0) {
				board.unshift(row);
				/* Push just played cell down */
				i++;
			} else board.push(row);
		}
		/* Extending horizontally
		** if played on leftmost or rightmost collumn */
		if (j === 0) {
			/* Add new cell on each line */
			for (var k = board.length - 1; k >= 0; k--) {
				board[k].unshift(' ');
			};
			/* Push just played cell to the right */
			j++;
		} else if (j === board[0].length-1) {
			/* Add new cell on each line */
			for (var k = board.length - 1; k >= 0; k--) {
				board[k].push(' ');
			};
		}
		return {i:i,j:j};
	}

	/* Check if the game is over
	** RETURN the sign index of the winner
	** RETURN null otherwise */
	function checkGameOver(i, j){
			/* Alias */
		var board = $scope.room.board;
			/* Temp array for each direction */
			/* Horizontal */
		var line1 = [],
			/* Vertical */
			line2 = [],
			/* Downward Diagonal */
			line3 = [],
			/* Upward Diagonal */
			line4 = [];
			/* Each take 9 cells 
			** with the just played cell
			** at the center */
		var h = j - 4;
		/* Iterating over each line
		** Push the cell accordingly
		** and push an empty cell
		** if the cell is outside of the board */
		for (var k = i - 4; k <= i + 4; k++, h++) {
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
		};
		/* Make a string to check with RegExp */
		var check = line1.concat(['|'],line2,['|'],line3,['|'],line4).join('');
		/* Test and return accordingly */
		if (/XXXXX| XXXX /.test(check)) return 0;
		else if (/OOOOO| OOOO /.test(check)) return 1;
		else return null;
	}

	/* Handle cell click */
	$scope.cellClick = function(i, j) {
		/* Alias */
		var room = $scope.room,
			board = room.board,
			turn = room.turn,
			winner = room.winner,
			player = $scope.player;
		/* Play the cell */
			/* IF: It's the turn to play */
		if (turn===player&&
			/* ANDIF: The board is empty */
			board[i][j]===' '&&
			/* ANDIF: The game is not over */
			!winner) {
			/* Play the cell */
			board[i][j] = signs[player];
			/* Update the board */
			room.$update({
				board: board,
				/* Extend the board */
				justPlayed: extendBoard(i,j),
				/* Switch turn */
				turn: turn^1,
				/* Update winner */
				winner: signs[checkGameOver(i,j)]
			});
		}
	};
}]);