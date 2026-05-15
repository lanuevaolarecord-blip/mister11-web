package com.mister11.app;

import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Habilitar edge-to-edge programáticamente
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

    // Hacer las barras transparentes
    getWindow().setStatusBarColor(Color.TRANSPARENT);
    getWindow().setNavigationBarColor(Color.TRANSPARENT);

    // Configurar el controlador de insets
    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    if (controller != null) {
      // Forzar iconos oscuros si el fondo es claro, o viceversa. 
      // Por ahora, dejamos que el sistema maneje el contraste básico o forzamos según tema si es necesario.
      controller.setAppearanceLightStatusBars(false); 
      controller.setAppearanceLightNavigationBars(false);
    }
  }
}
