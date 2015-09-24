/* eslint-env node */
var gulp = require("gulp");
var eslint = require("gulp-eslint");
var protractor = require("gulp-protractor").protractor;
var size = require("gulp-size");
var uglify = require("gulp-uglify");
var browserSync = require("browser-sync").create();
var karma = require("karma").Server;
var extend = require("util")._extend;
var runSequence = require("run-sequence");
var base = function(path) {
    return __dirname + (path.charAt(0) === "/" ? "" : "/") + path;
};
var browserSyncConfig = {
    reloadOnRestart: true,
    open: "local",
    online: false,
    server: {
        baseDir: "./website",
        routes: {
            "/assets": "node_modules",
            "/js": "dist/js",
            "/css": "dist/css"
        }
    }
};

gulp.task("js:build", function() {
    return gulp
      .src(base("app/**/*.js"))
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(uglify())
      .pipe(size({ gzip: true, prettySize: true }))
      .pipe(gulp.dest("dist"));
});

// Watch tasks.
gulp.task("watch:browser-sync", function() {
    var cfg = extend({}, browserSyncConfig);
    return browserSync.init(cfg);
});

gulp.task("watch:build", ["watch:test", "watch:js"], browserSync.reload);

gulp.task("watch:js", ["watch:lint", "js:build"]);

gulp.task("watch:karma", function(done) {
    return new karma({
        configFile: base("/karma.conf.js")
    }, done).start();
});

gulp.task("watch:lint", function() {
    return gulp
      .src(base("app/angular-material-calendar.js"))
      .pipe(eslint())
      .pipe(eslint.format());
});

gulp.task("watch:protractor", function() {
    return gulp
      .src(["./tests/e2e/*.spec.js"])
      .pipe(protractor({ configFile: base("protractor.conf.js") }));
});

gulp.task("watch:test", ["watch:lint", "watch:protractor", "watch:karma"]);
/// END watch tasks ///

// START ci tasks ///
gulp.task("browser-sync:ci", function() {
    var cfg = extend({}, browserSyncConfig);
    cfg.open = false;
    browserSync.init(cfg);
});

gulp.task("build:ci", ["js:ci"]);

gulp.task("js:ci", ["js:build"]);

gulp.task("karma:ci", function(done) {
    return new karma({
        configFile: base("/karma.conf.js"),
        singleRun: true
    }, done).start();
});

gulp.task("lint:ci", function() {
    return gulp
      .src(base("app/angular-material-calendar.js"))
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failOnError());
});

gulp.task("protractor:ci", ["browser-sync:ci"], function() {
    return gulp
      .src(["./tests/e2e/*.spec.js"])
      .pipe(protractor({ configFile: base("protractor.conf.js") }))
      .on("error", function(e) { throw e; })
      .on("end", browserSync.exit);
});

gulp.task("test:ci", function() {
    runSequence("lint:ci", "clean", "build:ci", ["karma:ci", "protractor:ci"]);
});
/// END ci tasks ///

// START standard tasks
gulp.task("clean", function() {
    return require("del")[
        base("dist/**/*")
    ];
});

gulp.task("watch", ["watch:browser-sync"], function() {
    gulp.watch(base("app/**/*"), ["watch:build"]);
});

gulp.task("default", ["watch"]);
