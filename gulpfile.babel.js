import gulp from 'gulp';
import sass from 'gulp-sass';
import ifElse from 'gulp-if-else';
import autoprefixer from 'gulp-autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import babelify from 'babelify';
import nodemon from 'gulp-nodemon';
import concat from 'gulp-concat';
import babel from 'gulp-babel';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import minify from 'gulp-minify-css';
import react from 'gulp-react';
import merge from 'merge-stream';
let browserSync =  require('browser-sync').create();

//main directories to use
const dirs = {
	src: './src',
	dest: './build',
	serverDest: './build/server',
	clientDest: './build/client' 
};

// styles tasks 

const sassPaths = {
	src: `${dirs.src}/client/style/`, 
	dest: `${dirs.clientDest}/style`
};

gulp.task('styles', () => {
	let sassStream = gulp.src(sassPaths.src + '**/*.scss')
		.pipe(sass())
		.pipe(concat('scss-files.scss'))

	let cssStream = gulp.src(sassPaths.src + '**/*.css')
		.pipe(concat('css-files.css'))

	return merge(sassStream, cssStream)
		.pipe(ifElse(process.env.NODE_ENV === 'development', sourcemaps.init))
		.pipe(autoprefixer())
		.pipe(concat('styles.css'))
		.pipe(minify())
		.pipe(ifElse(process.env.NODE_ENV === 'development',sourcemaps.write))
		.pipe(gulp.dest(sassPaths.dest))
		.pipe(browserSync.reload({stream:true}));
});
// end style tasks


// frontend scripts tasks
gulp.task('scripts', () => {
    return browserify({entries: `${dirs.src}/client/index.jsx`, extensions: ['.jsx'], debug: true })
        .transform('babelify', {presets: ['es2015', 'react']})
        .bundle()
        .on('error', (err) => {
            console.error(err.toString());
            
        })
        .pipe(source('bundle.js'))  
        .pipe(gulp.dest(`${dirs.clientDest}`))
        .pipe(browserSync.reload({stream:true}));
});

//end scripts tasks
 
 
 //watch for dev environment
gulp.task('watch', ['scripts', 'styles', 'compile-server'], () => {
	gulp.watch(['./src/client/**/*.+(js|jsx)'], ['scripts']);
	gulp.watch(['./src/client/**/*.+(css|scss)'], ['styles']);
	gulp.watch(['./src/server/**/*.js'], ['compile-server']);
});

//endwatch


//task for server build to es5
gulp.task('compile-server', () => {
	return gulp.src('src/server/**/*.js')
		.pipe(babel({
			presets: ['es2015']
		}).on('error', (err) => { console.error(err); }))
		.pipe(gulp.dest(`${dirs.serverDest}`))
		.pipe(browserSync.reload({stream:true}));
});

//end task server build

// develop task 
gulp.task('develop', ['watch'], () => {
	var stream = nodemon({
		script: `${dirs.serverDest}/index.js`,
		ext: 'js',
		ignore: ['node_modules/'],
		watch: dirs.serverDest
	})
	stream
		.on('restart', () => {
			console.log('nodemon restarting')
		})
		.on('crash', () => {
			console.error('application has crashed!\n');
			stream.emit('restart', 5);
		})
});
// end dev task

//html pipe into build dir
gulp.task('copyHTML', () => {
 	gulp.src(`${dirs.src}/client/index.html`)
 		.pipe(gulp.dest(`${dirs.clientDest}/`));
});
//end html

// only dev task 
gulp.task('browserSync', () => {
	browserSync.init({
		server: {
			baseDir: './build/client'
		},
		port: 3001
	});
});


// type 'gulp' to run project
gulp.task('default', ['develop', 'copyHTML', 'browserSync']);


