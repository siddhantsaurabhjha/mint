package com.lasi.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FirebaseBootstrap")
public class FirebaseBootstrapPlugin extends Plugin {

    @PluginMethod
    public void initialize(final PluginCall call) {
        JSObject result = new JSObject();

        try {
            Class<?> firebaseAppClass = Class.forName("com.google.firebase.FirebaseApp");
            Object app = firebaseAppClass.getMethod("initializeApp", android.content.Context.class).invoke(null, getContext());
            boolean initialized = app != null;
            result.put("initialized", initialized);
            Object apps = firebaseAppClass.getMethod("getApps", android.content.Context.class).invoke(null, getContext());
            boolean available = apps instanceof java.util.Collection && !((java.util.Collection<?>) apps).isEmpty();
            result.put("available", available);

            if (!initialized) {
                result.put("error", "FirebaseApp.initializeApp returned null");
            }

            call.resolve(result);
        } catch (Throwable error) {
            result.put("initialized", false);
            result.put("available", false);
            result.put("error", error.getMessage() == null ? error.toString() : error.getMessage());
            call.resolve(result);
        }
    }
}