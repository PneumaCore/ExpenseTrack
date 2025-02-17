import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonLoading, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { eye, eyeOff } from 'ionicons/icons';
import React, { useState } from 'react';
import { useHistory } from 'react-router';
import { auth, database } from '../configurations/firebase';
import './LogIn.css';

const LogIn: React.FC = () => {
  const history = useHistory();
  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState<boolean>();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* Comprobamos que el email sea válido */
  const validateEmail = (email: string) => {
    return email.match(
      /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    );
  };

  const validate = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;

    setIsValid(undefined);

    if (value === '') return;

    validateEmail(value) !== null ? setIsValid(true) : setIsValid(false);
  };

  const markTouched = () => {
    setIsTouched(true);
  };

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
          history.push('/home');
        } else {
          history.push('/account_setup');
        }
      } else {

        /* En caso de no existir el campo para realizar la comprobación, lo creamos y le redirigimos al formulario inicial */
        await setDoc(userDocRef, { uid: user.uid, isAccountSetup: false });
        history.push('/account_setup');
      }
    } catch (err: any) {
      setError("El correo electrónico o la contraseña son inválidos");
      setShowAlert(true);
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
      <IonContent>
        {loading && <IonLoading isOpen={loading} message={'Iniciando sesión...'} />}
        {showAlert && (<IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={'Inicio de sesión inválido'} message={error} buttons={['Aceptar']} />)}

        <IonGrid>

          {/* Logo de la aplicación */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <div className='login-image-container'>
                <IonImg src='/assets/icon.png' className='login-image'></IonImg>
              </div>
            </IonCol>
          </IonRow>

          {/* Campo de correo electrónico */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonItem>
                <IonInput className={`${isValid && 'ion-valid'} ${isValid === false && 'ion-invalid'} ${isTouched && 'ion-touched'}`} label='Correo electrónico' labelPlacement='floating' placeholder='Correo electrónico' type="email" value={email} onIonInput={(e) => { setEmail(e.detail.value!); validate(e); }} onIonBlur={() => markTouched()} required />
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Campo de contraseña */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonItem>
                <IonInput label='Contraseña' labelPlacement='floating' placeholder='Contraseña' type={showPassword ? "text" : "password"} value={password} onIonInput={(e) => setPassword(e.detail.value!)} required />
                <IonButton slot="end" fill="clear" onClick={() => setShowPassword(!showPassword)}>
                  <IonIcon icon={showPassword ? eye : eyeOff} />
                </IonButton>
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Botón para iniciar sesión */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonButton className='login-button' expand='full' color="medium" shape='round' onClick={handleLogIn}>Iniciar Sesión</IonButton>
            </IonCol>
          </IonRow>

          {/* Link para formulario de registro */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">

              {/* Si el usuario desea registrarse, se le redirige a la página de registro */}
              <IonLabel className="login-link" onClick={() => history.push('/signup')}>¿Aún no tienes una cuenta? Regístrate</IonLabel>
            </IonCol>
          </IonRow>

          {/* Link para resetear la contraseña */}
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonLabel className="reset-password-link" onClick={() => history.push('/reset_password')}>Recuperar contraseña</IonLabel>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage >
  );
};

export default LogIn;
