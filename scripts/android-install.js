#!/usr/bin/env node

module.exports = function (context) {
    var path         = context.requireCordovaModule('path'),
        fs           = context.requireCordovaModule('fs'),
        shell        = context.requireCordovaModule('shelljs'),
        projectRoot  = context.opts.projectRoot,
        ConfigParser = context.requireCordovaModule('cordova-common').ConfigParser,
        config       = new ConfigParser(path.join(context.opts.projectRoot, "config.xml")),
        packageName = config.android_packageName() || config.packageName();

    console.info("Running android-install.Hook: " + context.hook + ", Package: " + packageName + ", Path: " + projectRoot + ".");

    if (!packageName) {
        console.error("Package name could not be found!");
        return ;
    }

    // android platform available?
    if (context.opts.cordova.platforms.indexOf("android") === -1) {
        console.info("Android platform has not been added.");
        return ;
    }

    var targetDir  = path.join(projectRoot, "platforms", "android", "src", packageName.replace(/\./g, path.sep), "wxapi");
        targetFiles = ["EntryActivity.java", "WXEntryActivity.java", "WXPayEntryActivity.java"];

    if (['after_plugin_add', 'after_plugin_install', 'after_platform_add'].indexOf(context.hook) === -1) {
        // remove it?
        targetFiles.forEach(function (f) {
            try {
                fs.unlinkSync(path.join(targetDir, f));
            } catch (err) {}
        });
    } else {
        // create directory
        shell.mkdir('-p', targetDir);

        // sync the content
        targetFiles.forEach(function (f) {
            fs.readFile(path.join(context.opts.plugin.dir, 'src', 'android', f), {encoding: 'utf-8'}, function (err, data) {
                if (err) {
                    throw err;
                }

                data = data.replace(/^package __PACKAGE_NAME__;/m, 'package ' + packageName + '.wxapi;');
                fs.writeFileSync(path.join(targetDir, f), data);
            });
        });
    }
};
