import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton, IonItem, IonLabel, IonLoading } from '@ionic/react';
import { auth } from '../configurations/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useHistory } from 'react-router';
import './LogIn.css';

const LogIn: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const history = useHistory();
  
    const handleLogin = async () => {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        history.push('/tab1');
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
          {error && <p>{error}</p>}
          <IonItem>
            <IonLabel position="floating">Correo electrónico</IonLabel>
            <IonInput type="email" value={email} onIonChange={(e) => setEmail(e.detail.value!)} required />
          </IonItem>
          <IonItem>
            <IonLabel position="floating">Contraseña</IonLabel>
            <IonInput type="password" value={password} onIonChange={(e) => setPassword(e.detail.value!)} required />
          </IonItem>
          <IonButton expand="full" onClick={handleLogin}>Iniciar Sesión</IonButton>
        </IonContent>
      </IonPage>
    );
  };
  
  export default LogIn;
