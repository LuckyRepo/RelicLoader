package com.dt3264.deezloader;

import android.Manifest;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.design.widget.Snackbar;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;
import android.content.res.AssetManager;
import android.webkit.WebView;
import android.widget.Toast;

import java.io.*;
import java.util.Objects;

import io.reactivex.Observable;
import io.reactivex.ObservableEmitter;
import io.reactivex.ObservableOnSubscribe;
import io.reactivex.Observer;
import io.reactivex.android.plugins.RxAndroidPlugins;
import io.reactivex.android.schedulers.AndroidSchedulers;
import io.reactivex.disposables.Disposable;
import io.reactivex.plugins.RxJavaPlugins;
import io.reactivex.schedulers.Schedulers;
import io.socket.client.Socket;
import vcm.github.webkit.proview.ProWebView;


public class MainActivity extends AppCompatActivity {

    // Used to load the 'native-lib' library on application startup.
    static {
        System.loadLibrary("native-lib");
        System.loadLibrary("node");
    }

    Context context;
    Snackbar snackbar;
    ProWebView webView;
    SharedPreferences sharedPreferences;
    final String url = "http://localhost:1730";
    String SHARED_PREFS_NEW_PATH = "newPath";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Objects.requireNonNull(getSupportActionBar()).hide();
        preparaHandler();
        webView = findViewById(R.id.webView);
        webView.setActivity(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, true);
        }
        snackbar = Snackbar.make(webView, "Prepairing server", Snackbar.LENGTH_INDEFINITE);
        snackbar.show();
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        if (savedInstanceState == null) compruebaPermisos();
        else muestraPagina();
    }

    /**
     * Main methods
     */

    void compruebaPermisos(){
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            // No explanation needed, we can request the permission.
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE}, 100);
        } else {
            compruebaServidor();
        }
    }

    void compruebaServidor() {
        if (!MyService.isServiceRunning) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    checkIsApkUpdated();
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            snackbar.setText("Starting server");
                        }
                    });
                    Intent startIntent = new Intent(getApplicationContext(), MyService.class);
                    startIntent.setAction(getString(R.string.serviceName));
                    startService(startIntent);
                }
            }).start();
        } else {
            muestraPagina();
        }
    }

    void muestraPagina() {
        context = this;
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                ProWebView webView = findViewById(R.id.webView);
                webView.loadUrl(url);
                snackbar.dismiss();
            }
        });
    }

    /**
     * Rx2 Components
     */
    //Observer which recieves and handles the data
    public static Observer<Message> mainDataHandler;
    private Observer<Message> _mainDataHandler = new Observer<Message>() {
        @Override
        public void onSubscribe(Disposable d) { }
        @Override
        public void onNext(Message msg) {
            if(msg.getType()==1 && !MyService.pageAlreadyOpen) {
                muestraPagina();
                MyService.pageAlreadyOpen = true;
                Toast.makeText(getBaseContext(), "Server ready", Toast.LENGTH_SHORT).show();
            }
            else if(msg.getType()==2 && MyService.hasRequestedNewPath){
                startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE), 1234);
                MyService.hasRequestedNewPath = false;
            }
            else if(msg.getType()==4){
                finishAndRemoveTask();
            }
        }
        @Override
        public void onError(Throwable e) { }
        @Override
        public void onComplete() { }
    };

    void preparaHandler(){
        mainDataHandler = _mainDataHandler;
    }

    //And the method which transmits the data to the Service
    void transmitMessage(Message msg){
        Message.transmitMessage(msg)
                // Run on a background thread
                .subscribeOn(Schedulers.io())
                // Be notified on the main thread
                .observeOn(AndroidSchedulers.mainThread())
                // The method that handles the data
                .subscribe(MyService.serviceDataHandler);
    }

    boolean doubleBackToExitPressedOnce = false;

    @Override
    public void onBackPressed() {
        if (doubleBackToExitPressedOnce) {
            super.onBackPressed();
            return;
        }
        this.doubleBackToExitPressedOnce = true;
        String message = "Click BACK again to exit the app (all remaining downloads will be removed) or Home to exit without close";
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                doubleBackToExitPressedOnce=false;
            }
        }, 2000);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        webView.onActivityResult(requestCode, resultCode, data);
        if (resultCode == RESULT_OK && requestCode == 1234){
            Uri treeUri = data.getData();
            sharedPreferences.edit().putString(SHARED_PREFS_NEW_PATH, Objects.requireNonNull(treeUri).toString()).apply();
            String realPath = Objects.requireNonNull(treeUri.getPath()).replace("tree", "storage").replace(":", "/");
            if(!realPath.endsWith("/")) realPath+="/";
            transmitMessage(new Message(3, realPath));
        }
    }

    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
        webView.onRestoreInstanceState(savedInstanceState);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        webView.onRequestPermissionResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case 100: {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    // permission was granted, yay!
                    compruebaServidor();

                } else {
                    // permission denied, boo!
                    Toast.makeText(this, "You should give the permission to use the app", Toast.LENGTH_SHORT).show();
                    this.finish();
                }
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.onSavedInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        webView.onDestroy();
        //EventBus.getDefault().unregister(this);
    }

    /**
     * A native method that is implemented by the 'native-lib' native library,
     * which is packaged with this application.
     */
    @SuppressWarnings("JniMissingFunction")
    public static native Integer startNodeWithArguments(String[] arguments);

    /**
     * Check server files methods
     */
    private void checkIsApkUpdated(){
        if (wasAPKUpdated()) {
            //Recursively delete any existing nodejs-project.
            String nodeDir = getApplicationContext().getFilesDir().getAbsolutePath() + "/deezerLoader";
            File nodeDirReference = new File(nodeDir);
            if (nodeDirReference.exists()) {
                deleteFolderRecursively(new File(nodeDir));
            }
            //Copy the node project from assets into the application's data path.
            copyAssetFolder(getApplicationContext().getAssets(), "deezerLoader", nodeDir);
            saveLastUpdateTime();
        }
    }

    private boolean wasAPKUpdated() {
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this);
        long previousLastUpdateTime = prefs.getLong("NODEJS_MOBILE_APK_LastUpdateTime", 0);
        long lastUpdateTime = 1;
        try {
            PackageInfo packageInfo = getApplicationContext().getPackageManager().getPackageInfo(getApplicationContext().getPackageName(), 0);
            lastUpdateTime = packageInfo.lastUpdateTime;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return (lastUpdateTime != previousLastUpdateTime);
    }

    private void saveLastUpdateTime() {
        long lastUpdateTime = 1;
        try {
            PackageInfo packageInfo = getApplicationContext().getPackageManager().getPackageInfo(getApplicationContext().getPackageName(), 0);
            lastUpdateTime = packageInfo.lastUpdateTime;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putLong("NODEJS_MOBILE_APK_LastUpdateTime", lastUpdateTime);
        editor.apply();
    }

    private static boolean deleteFolderRecursively(File file) {
        try {
            boolean res = true;
            for (File childFile : file.listFiles()) {
                if (childFile.isDirectory()) {
                    res &= deleteFolderRecursively(childFile);
                } else {
                    res &= childFile.delete();
                }
            }
            res &= file.delete();
            return res;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private static boolean copyAssetFolder(AssetManager assetManager, String fromAssetPath, String toPath) {
        try {
            String[] files = assetManager.list(fromAssetPath);
            boolean res = true;

            if (Objects.requireNonNull(files).length == 0) {
                //If it's a file, it won't have any assets "inside" it.
                res = copyAsset(assetManager, fromAssetPath, toPath);
            } else {
                new File(toPath).mkdirs();
                for (String file : files)
                    res &= copyAssetFolder(assetManager, fromAssetPath + "/" + file, toPath + "/" + file);
            }
            return res;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private static boolean copyAsset(AssetManager assetManager, String fromAssetPath, String toPath) {
        InputStream in = null;
        OutputStream out = null;
        try {
            in = assetManager.open(fromAssetPath);
            new File(toPath).createNewFile();
            out = new FileOutputStream(toPath);
            copyFile(in, out);
            in.close();
            in = null;
            out.flush();
            out.close();
            out = null;
            return true;
        } catch (Exception e) {
            e.printStackTrace();

            return false;
        }
    }

    private static void copyFile(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[1024];
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
    }
}