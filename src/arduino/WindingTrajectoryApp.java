import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.paint.Color;
import javafx.stage.Stage;

import java.util.ArrayList;
import java.util.List;

public class WindingTrajectoryApp extends Application {

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage primaryStage) {
        // UI: Entradas de parámetros con valores por defecto
        TextField tfD = new TextField("100");
        TextField tfL = new TextField("200");
        TextField tfd = new TextField("1.75");
        TextField tfTheta = new TextField("10");
        TextField tfN = new TextField("5");
        TextField tfRes = new TextField("200");

        Button btnDraw = new Button("Generar Trayectoria");
        btnDraw.setStyle("-fx-background-color: #0ea5e9; -fx-text-fill: white; -fx-font-weight: bold;");

        HBox controls = new HBox(10,
                new Label("D:"), tfD,
                new Label("L:"), tfL,
                new Label("d:"), tfd,
                new Label("θ°:"), tfTheta,
                new Label("Capas:"), tfN,
                new Label("Res:"), tfRes,
                btnDraw
        );
        controls.setStyle("-fx-padding: 10; -fx-background-color: #f4f4f5;");

        Canvas canvas = new Canvas(800, 600);
        GraphicsContext gc = canvas.getGraphicsContext2D();

        // Fondo inicial del canvas
        gc.setFill(Color.WHITE);
        gc.fillRect(0, 0, canvas.getWidth(), canvas.getHeight());

        btnDraw.setOnAction(e -> {
            try {
                double D = Double.parseDouble(tfD.getText());
                double L = Double.parseDouble(tfL.getText());
                double d = Double.parseDouble(tfd.getText());
                double theta = Double.parseDouble(tfTheta.getText());
                int N = Integer.parseInt(tfN.getText());
                int res = Integer.parseInt(tfRes.getText());

                List<CustomPoint3D> traj = generateTrajectory(D, L, d, theta, N, res);
                draw2D(gc, traj, canvas.getWidth(), canvas.getHeight(), L, D / 2.0);
            } catch (NumberFormatException ex) {
                System.err.println("Error: Por favor ingresa números válidos.");
            }
        });

        BorderPane root = new BorderPane();
        root.setTop(controls);
        root.setCenter(canvas);

        Scene scene = new Scene(root, 900, 700);
        primaryStage.setScene(scene);
        primaryStage.setTitle("SAFI - Visualizador de Bobinado (JavaFX)");
        primaryStage.show();
    }

    private List<CustomPoint3D> generateTrajectory(double D, double L, double d, double thetaDeg, int N, int res) {
        double R = D / 2.0;
        double thetaRad = Math.toRadians(thetaDeg);

        //dzPerRev es el avance axial por cada vuelta completa
        double dzPerRev = 2 * Math.PI * R * Math.tan(thetaRad);

        // Evitar división por cero si el ángulo es 0
        if (dzPerRev == 0) dzPerRev = 0.001;

        double totalRevs = L / dzPerRev;
        int fullRevs = (int) Math.floor(totalRevs);
        double partialRev = totalRevs - fullRevs;

        List<CustomPoint3D> pts = new ArrayList<>();
        for (int layer = 0; layer < N; layer++) {
            // El radio disminuye conforme agregamos capas (o aumenta según el diseño)
            double rLayer = R - (layer * d);

            for (int rev = 0; rev < fullRevs; rev++) {
                for (int i = 0; i < res; i++) {
                    double fraction = (rev + i / (double) res);
                    double t = fraction * 2 * Math.PI;
                    double z = fraction * dzPerRev;
                    double x = rLayer * Math.cos(t);
                    double y = rLayer * Math.sin(t);
                    pts.add(new CustomPoint3D(x, y, z));
                }
            }
            // Tramo final de la trayectoria
            if (partialRev > 1e-6) {
                int partCount = (int) Math.ceil(res * partialRev);
                for (int i = 0; i < partCount; i++) {
                    double fraction = (fullRevs + i / (double) res);
                    double t = fraction * 2 * Math.PI;
                    double z = fraction * dzPerRev;
                    double x = rLayer * Math.cos(t);
                    double y = rLayer * Math.sin(t);
                    pts.add(new CustomPoint3D(x, y, z));
                }
            }
        }
        return pts;
    }

    private void draw2D(GraphicsContext gc, List<CustomPoint3D> pts, double w, double h, double L, double R) {
        // Limpiar fondo
        gc.setFill(Color.WHITE);
        gc.fillRect(0, 0, w, h);

        // Dibujar el contorno del mandril (cilindro) para referencia
        gc.setStroke(Color.LIGHTGRAY);
        gc.setLineWidth(2.0);
        double margin = 60;
        double scaleX = (w - 2 * margin) / (2 * R);
        double scaleZ = (h - 2 * margin) / L;
        double offsetX = w / 2;
        double offsetZ = margin;

        gc.strokeRect(offsetX - R * scaleX, offsetZ, 2 * R * scaleX, L * scaleZ);

        // Dibujar trayectoria del filamento
        gc.setStroke(Color.DARKBLUE);
        gc.setLineWidth(1.2);

        for (int i = 1; i < pts.size(); i++) {
            CustomPoint3D p1 = pts.get(i - 1);
            CustomPoint3D p2 = pts.get(i);

            // Usamos X y Z para la proyección lateral
            double x1 = offsetX + p1.x * scaleX;
            double z1 = offsetZ + p1.z * scaleZ;
            double x2 = offsetX + p2.x * scaleX;
            double z2 = offsetZ + p2.z * scaleZ;

            // Solo dibujamos si el punto está "al frente" (Y > 0) para simular 3D
            // Opcional: puedes quitar el if para ver toda la "transparencia"
            gc.strokeLine(x1, z1, x2, z2);
        }
    }

    // Cambiamos el nombre para evitar conflictos con javafx.geometry.Point3D
    public static class CustomPoint3D {
        public double x, y, z;
        public CustomPoint3D(double x, double y, double z) {
            this.x = x; this.y = y; this.z = z;
        }
    }
}