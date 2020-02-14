const settings = {
  server: true,
  styles: true,
  pug: true,
  scripts: true,
  user: true,
  admin: true
};

const paths = {
  server: "dist/",
  user: {
    input: "src/user",
    ouput: "dist/user",
    styles: {
      input: "src/user/scss/main.scss",
      output: "dist/user/css"
    },
    pug: {
      input: "src/user/pug/pages/*.pug",
      output: "dist/user/pages",
      base: "src/user/pug/pages"
    },
    scripts: {
      input: "src/user/js/**/*.js",
      output: "dist/user/js"
    }
  },
  admin: {
    input: "src/admin",
    ouput: "dist/admin",
    styles: {
      input: "src/admin/scss/main.scss",
      output: "dist/admin/css"
    },
    pug: {
      input: "src/admin/pug/pages/*.pug",
      output: "dist/admin/pages",
      base: "src/admin/pug/pages"
    },
    scripts: {
      input: "src/admin/js/**/*.js",
      output: "dist/admin/js"
    }
  }
};

const { gulp, src, dest, watch, series, parallel } = require("gulp");
const rename = require("gulp-rename");

// scss -> css
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const prefix = require("autoprefixer");
const minify = require("cssnano");

// pug -> html
const pug = require("gulp-pug");

//server
const browserSync = require("browser-sync");

//scripts
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

const done = (done) => done();

// build scss files
const buildStyles = function(inputPath, outputPath) {
  // Not run this function if false in settings
  if (!settings.styles) return done;


  return src(inputPath)
    .pipe(sass())
    .pipe(postcss([prefix()]))
    .pipe(dest(outputPath))
    .pipe(rename({ suffix: ".min" }))
    .pipe(
      postcss([
        minify({
          discardComments: {
            removeAll: true
          }
        })
      ])
    )
    .pipe(dest(outputPath));
};

// build pug files
const buildPug = function(inputPath, outputPath, basePage) {
  // Not run this function if false in settings
  if (!settings.pug) return done;

  return src(inputPath, { base: basePage })
  .pipe(pug())
  .pipe(
    rename({
      extname: ".html"
    })
  )
  .pipe(dest(outputPath));
};

//lint scripts
const lintScripts = function(inputPath) {
  if (!settings.scripts) return done;

  return src(inputPath)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
};

//build scripts
const buildScripts = function(inputPath, outputPath) {
  if (!settings.scripts) return done;

  return src(inputPath)
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(dest(outputPath));
};

//start server
const startServer = function () {
  if (!settings.server) return done;

  // paths.server
  browserSync.init({
    server: {
      baseDir: paths.server
    }
  });

  done;
};

// Watch for changes to the src directory
const reloadBrowser = function (done) {
  if (!settings.server) return done();
  browserSync.reload();
  done();
};

// Watch for changes in user pages
const userWatchSource = function(done) {
  const watcher = watch(paths.user.input, series(parallel(userWatchSource, reloadBrowser)));
  watcher.on('all', () => {
    buildStyles(paths.user.styles.input, paths.user.styles.output);
    buildPug(paths.user.pug.input, paths.user.pug.output, paths.user.pug.base);
    lintScripts(paths.user.scripts.input);
    buildScripts(paths.user.scripts.input, paths.user.scripts.output);
  });
  done();
};

exports.userWatch = series(
  parallel(
    userWatchSource,
    startServer
  )
);

// Watch for changes in admin pages
const adminWatchSource = function(done) {
  const watcher = watch(paths.admin.input, series(parallel(adminWatchSource, reloadBrowser)));
  watcher.on('all', () => {
    buildStyles(paths.admin.styles.input, paths.admin.styles.output);
    buildPug(paths.admin.pug.input, paths.admin.pug.output, paths.admin.pug.base);
    lintScripts(paths.admin.scripts.input);
    buildScripts(paths.admin.scripts.input, paths.admin.scripts.output);
  });
  done();
};

exports.adminWatch = series(
  parallel(
    adminWatchSource,
    startServer
  )
);

exports.watch = series(
  parallel(
    userWatchSource,
    adminWatchSource,
    startServer
  )
);