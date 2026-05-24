package com.lasi.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		try {
			Class<?> firebaseAppClass = Class.forName("com.google.firebase.FirebaseApp");
			firebaseAppClass.getMethod("initializeApp", android.content.Context.class).invoke(null, this);
			System.out.println("[firebase] initializeApp invoked from MainActivity");
		} catch (Throwable error) {
			System.err.println("[firebase] initializeApp failed: " + error.getMessage());
		}

		registerPlugin(FirebaseBootstrapPlugin.class);
		super.onCreate(savedInstanceState);
	}
}
