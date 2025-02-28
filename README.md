# ExpenseTrack

<p align="center">
  <img src="public/assets/icon.png" alt="ExpenseTrack Logo" />
</p>

ExpenseTrack es una aplicación móvil para Android que te ayuda a gestionar tus finanzas personales de manera sencilla y eficiente. Permite registrar transacciones de ingresos y gastos, organizar categorías, gestionar cuentas y visualizar tu historial financiero en un solo lugar.

## Tecnologías utilizadas

 - [**Ionic**](https://ionicframework.com/): Framework para desarrollo de aplicaciones multiplataforma e híbridas.

 - [**React**](https://es.react.dev/): Bibliotecas de JavaScript/TypeScript para construir la interfaz de usuario.

 - [**Firebase**](https://firebase.google.com/?hl=es-419): Plataforma backend para autenticación y almacenamiento de datos.

 - [**ExchangeRate-API**](https://www.exchangerate-api.com/): API para la conversión automática de saldo total a la divisa preferida del usuario.


## Características

 - Registrar transacciones de ingresos y gastos.

 - Crear y gestionar cuentas personales.

 - Transferencias entre cuentas y visualización del historial de transferencias.

 - Clasificar transacciones en categorías de tipo gasto o ingreso (por defecto o personalizadas).

 - Visualización de gasto mensual de una categoría deseada (presupuesto).

 - Visualización del saldo total de todas las cuentas en la divisa preferida del usuario.

 - Estadísticas detalladas y gráficos sobre finanzas personales.


## Instalación

### Para usuario

#### 1. Descarga el archivo APK desde la [sección de releases](https://github.com/PneumaCore/ExpenseTrack/releases).

#### 2. Activa la instalación desde fuentes desconocidas en tu dispositivo Android.

#### 3. Instala la aplicación.


### Para desarrolladores

#### 1. Clona el repositorio:

```

  git clone https://github.com/PneumaCore/ExpenseTrack.git

```

#### 2. Instala las dependencias:

Navega al directorio de la aplicación y ejecuta el siguiente comando para instalar todas las dependencias:

```

  cd ExpenseTrack
  npm install

```


#### 3. Configurar Firebase:

Para conectar la aplicación con Firebase, necesitarás las claves API de tu proyecto de Firebase. Sigue estos pasos para obtenerlas:

#### - Regístrate o inicia sesión en [Firebase](https://firebase.google.com/?hl=es-419).

#### - Crea un nuevo proyecto llamado ExpenseTrack en [Firebase Console](https://console.firebase.google.com/u/0/?hl=es-419).

#### - En la pantalla principal del proyecto, en el apartado para agregar Firebase a tu app, pulsa en 'Web', con esto, generarás las claves API.

#### - Ahora, crea un archivo '.env' en el directorio raíz de la aplicación y agrega las claves API generadas de la siguiente forma:

```

  VITE_APP_API_KEY=tu_clave_api
  VITE_APP_AUTH_DOMAIN=tu_clave_auth_domain
  VITE_APP_PROJECT_ID=tu_clave_project_id
  VITE_APP_STORAGE_BUCKET=tu_clave_storage_bucket
  VITE_APP_MESSAGING_SENDER_ID=tu_clave_messaging_sender
  VITE_APP_APP_ID=tu_clave_app_id

```

#### 4. Crear colecciones en Cloud Firestore:

Además de las claves, necesitarás las colecciones de la base de datos que se manejan en la aplicación, para ello, vuelve nuevamente a la pantalla principal del proyecto de Firebase. Pulsa en 'Todos los productos' y busca en la lista 'Cloud Firestore' y pulsa en 'Crear base de datos'. Selecciona un servidor europeo e inicia la base de datos en modo de producción. A continuación, deberás crear las siugientes colecciones:



#### 5. Ejecuta la aplicación:

```

  ionic serve

```


## Capturas de pantalla



## Licencia

Este proyecto está licenciado bajo la MIT License.

## Contacto

Para cualquier consulta o sugerencia:

 - ✉️ Email: luciamengualr18@gmail.com

