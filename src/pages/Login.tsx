import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonItem, IonLabel, IonLoading, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { useHistory } from 'react-router';
import { auth, database } from '../configurations/firebase';
import './LogIn.css';

const LogIn: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const history = useHistory();

  /* Se inicia sesión con el correo y la contraseña proporcionados por el usuario, si el usuario existe en Firebase, se le redirige al menú principal de la aplicación */
  const handleLogIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      /* Comprobamos que el usuario que acaba de iniciar sesión, haya realizado el formulario inicial para configurar la cuenta principal para las transacciones */
      const userDocRef = doc(database, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        /* Si el usuario ha realizado el formulario inicial, se le redirige a la página principal de la aplicación, si no, se le redirige al formulario inicial */
        if (userData.isAccountSetup) {
          history.push('/tab1');
        } else {
          history.push('/account_setup');
        }
      } else {

        /* En caso de no existir el campo para realizar la comprobación, lo creamos y le redirigimos al formulario inicial */
        await setDoc(userDocRef, { uid: user.uid, isAccountSetup: false });
        history.push('/account_setup');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Iniciar sesión</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="login-content">
        {loading && <IonLoading isOpen={loading} message={'Iniciando sesión...'} />}

        <IonGrid>

          {/* Campo de error de autentificación */}
          <IonRow className="login-row">
            <IonCol size="12" size-md="8" offset-md="2">
              {error && <p className="error-message">{error}</p>}
            </IonCol>
          </IonRow>

          {/* Campo de correo electrónico */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonItem>
                <IonInput label='Correo electrónico' labelPlacement='floating' placeholder='Correo electrónico' type="email" value={email} onIonChange={(e) => setEmail(e.detail.value!)} required />
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Campo de contraseña */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonItem>
                <IonInput label='Contraseña' labelPlacement='floating' placeholder='Contraseña' type="password" value={password} onIonChange={(e) => setPassword(e.detail.value!)} required />
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Botón para iniciar sesión */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonButton expand="full" onClick={handleLogIn}>Iniciar Sesión</IonButton>
            </IonCol>
          </IonRow>

          {/* Link para formulario de registro */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">

              {/* Si el usuario desea registrarse, se le redirige a la página de registro */}
              <IonLabel className="signup-link" onClick={() => history.push('/signup')}>¿Aún no tienes una cuenta? Regístrate</IonLabel>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default LogIn;
