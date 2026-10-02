/* Local checkpoint storage and tab pause/resume support. */
(function (window, document) {
  "use strict";

  var KEY = "pikachu-checkpoint-v1";
  var pausedByVisibility = false;

  function read() {
    try {
      return JSON.parse(window.localStorage.getItem(KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch (error) {}
  }

  function copyMatrix(matrix) {
    return matrix.map(function (column) {
      return column.slice();
    });
  }

  function save(board) {
    if (!board || !board.arrValue || !window.elTimebar) return;

    var checkpoint = {
      version: 1,
      level: Number(board.level) || 1,
      blood: Number(board.blood) || 0,
      score: Number(board.score) || 0,
      totalscore: Number(window.totalscore) || 0,
      totalScorethis: Number(window.totalScorethis) || 0,
      endless: !!(document.getElementById("endlessMode") && document.getElementById("endlessMode").checked),
      time: Math.max(0, Number(window.elTimebar.tmp) || 0),
      arrValue: copyMatrix(board.arrValue),
    };

    try {
      window.localStorage.setItem(KEY, JSON.stringify(checkpoint));
    } catch (error) {}
  }

  function isValid(checkpoint) {
    return (
      checkpoint &&
      checkpoint.version === 1 &&
      Array.isArray(checkpoint.arrValue) &&
      checkpoint.arrValue.length === 18 &&
      checkpoint.arrValue.every(function (column) {
        return Array.isArray(column) && column.length === 11;
      }) &&
      Number(checkpoint.time) > 0
    );
  }

  function restore(board) {
    var checkpoint = read();
    if (!isValid(checkpoint)) {
      if (checkpoint) clear();
      return false;
    }

    board.level = Number(checkpoint.level) || 1;
    board.blood = Number(checkpoint.blood) || 0;
    board.score = Number(checkpoint.score) || 0;
    board.isWaiting = false;
    board.arrValue = copyMatrix(checkpoint.arrValue);
    window.totalscore = Number(checkpoint.totalscore) || 0;
    window.totalScorethis = Number(checkpoint.totalScorethis) || 0;
    var endlessCheckbox = document.getElementById("endlessMode");
    if (endlessCheckbox && typeof checkpoint.endless === "boolean") endlessCheckbox.checked = checkpoint.endless;
    window.elTimebar.tmp = Number(checkpoint.time);
    window.elTimebar.style.height = window.elTimebar.tmp + "px";

    board.applyMatrix();
    repaint("level", board.level);
    repaint("blood", board.blood);
    repaint("score", board.level === 1 ? board.score : window.totalscore);
    window.startCountDown(true);
    return true;
  }

  function pause(board) {
    if (window.timeID > 0) {
      window.clearInterval(window.timeID);
      window.timeID = 0;
    }
    save(board);
    pausedByVisibility = true;
  }

  function resume(board) {
    if (!pausedByVisibility || !board) return;
    pausedByVisibility = false;
    window.startCountDown(true);
  }

  document.addEventListener("change", function (event) {
    if (event.target && event.target.id === "endlessMode" && window.el) save(window.el);
  });

  document.addEventListener("visibilitychange", function () {
    if (!window.el) return;
    if (document.hidden) pause(window.el);
    else resume(window.el);
  });

  window.addEventListener("pagehide", function () {
    if (window.el) save(window.el);
  });

  window.localSave = {
    clear: clear,
    save: save,
    restore: restore,
    pause: pause,
    resume: resume,
  };
})(window, document);