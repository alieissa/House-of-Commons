'use strict';

const gulp = require('gulp');
const jshint  = require('gulp-jshint');
// const babelify = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

gulp.task('es6', es6);
gulp.task('lint', lint);

gulp.task('watch', () => {
    gulp.watch('./*.js', ['lint', 'es6']);
});

gulp.task('default', ['lint', 'es6', 'watch']);

function lint() {
    return gulp.src('./*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
}

function es6() {
	browserify('./app.js')
		.transform('babelify', { presets: ['es2015'] })
		.bundle().on('error', console.error.bind(console))
		.pipe(source('app.js'))
		.pipe(buffer())
		.pipe(gulp.dest('dist/'));
}
