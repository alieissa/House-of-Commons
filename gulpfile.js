'use strict';

const jshint  = require('gulp-jshint');
const gulp = require('gulp');


gulp.task('lint', () => {
    return gulp.src('./*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', () => {
    gulp.watch('./*.js', ['lint']);
});
gulp.task('default', ['watch']);
