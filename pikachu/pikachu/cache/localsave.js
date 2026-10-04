/* Local checkpoint storage and tab pause/resume support. */
(function (window, document) {
  "use strict";

  var KEY = "pikachu-checkpoint-v1";
  var HIGH_SCORE_KEY = "pikachu-high-score";
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

  function getHighScore() {
    try {
      return Number(window.localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch (error) {
      return 0;
    }
  }

  function renderHighScore() {
    var display = document.getElementById("highScore");
    if (display) {
      var score = getHighScore();
      display.textContent = "High score: " + score;
      display.style.display = score > 0 ? "block" : "none";
    }
  }

  function recordHighScore(score) {
    score = Number(score) || 0;
    if (score > getHighScore()) {
      try {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
      } catch (error) {}
    }
    renderHighScore();
  }

  function resetHighScore() {
    try {
      window.localStorage.removeItem(HIGH_SCORE_KEY);
    } catch (error) {}
    renderHighScore();
  }
  function save(board) {
    if (!board || !board.arrValue || !window.elTimebar) return;

    var checkpoint = {
      version: 1,
      level: Number(board.level) || 1,
      patternLevel: Number(board.patternLevel) || (((Number(board.level) || 1) - 1) % 9) + 1,
      blood: Number(board.blood) || 0,
      score: Number(board.score) || 0,
      totalscore: Number(window.totalscore) || 0,
      totalScorethis: Number(window.totalScorethis) || 0,
      endless: !!(document.getElementById("endlessMode") && document.getElementById("endlessMode").checked),
      timeMode: !!(document.getElementById("timeMode") && document.getElementById("timeMode").checked),
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
    board.patternLevel = Number(checkpoint.patternLevel) || (((board.level - 1) % 9) + 1);
    board.blood = Number(checkpoint.blood) || 0;
    board.score = Number(checkpoint.score) || 0;
    board.isWaiting = false;
    board.arrValue = copyMatrix(checkpoint.arrValue);
    var restoredTotal = Number(checkpoint.totalScorethis) || Number(checkpoint.totalscore) || 0;
    window.totalScorethis = restoredTotal;
    window.totalscore = restoredTotal;
    var endlessCheckbox = document.getElementById("endlessMode");
    if (endlessCheckbox && typeof checkpoint.endless === "boolean") endlessCheckbox.checked = checkpoint.endless;
    var timeCheckbox = document.getElementById("timeMode");
    if (timeCheckbox && typeof checkpoint.timeMode === "boolean") timeCheckbox.checked = checkpoint.timeMode;
    window.elTimebar.tmp = Number(checkpoint.time);
    window.updateTimebar();

    board.applyMatrix();
    repaint("levelNumber", board.level);
    var repeat = Math.floor((board.level - 1) / 9);
    var repeatDisplay = document.getElementById("repeat");
    if (repeatDisplay) repeatDisplay.textContent = repeat > 0 ? String(repeat + 1) : "";
    repaint("blood", board.blood);
    repaint("score", window.totalScorethis);
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

  document.addEventListener("click", function (event) {
    if (event.target && event.target.id === "highScore" && window.confirm("Reset high score?")) resetHighScore();
  });

  document.addEventListener("change", function (event) {
    if (!event.target || !window.el) return;
    if (event.target.id === "endlessMode") save(window.el);
    if (event.target.id === "timeMode") {
      if (event.target.checked) window.startCountDown(true);
      else {
        if (window.timeID > 0) window.clearInterval(window.timeID);
        window.timeID = 0;
        window.updateTimebar();
        save(window.el);
      }
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (!window.el) return;
    if (document.hidden) pause(window.el);
    else resume(window.el);
  });

  window.addEventListener("pagehide", function () {
    if (window.el) save(window.el);
  });

  document.addEventListener("DOMContentLoaded", renderHighScore);
  renderHighScore();

  window.localSave = {
    clear: clear,
    save: save,
    restore: restore,
    pause: pause,
    recordHighScore: recordHighScore,
    resume: resume,
  };
})(window, document);