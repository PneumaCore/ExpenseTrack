import React from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import { auth } from '../configurations/firebase';
import { signOut } from 'firebase/auth';
import { useHistory } from 'react-router';
import './Tab4.css';

const Tab4: React.FC = () => {
  const history = useHistory();

  /* Se cierra la sesión actual del usuario y se le redirige a la pantalla de inicio de sesión */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      history.push('/login');
    } catch (error) {
      console.error("Error cerrando sesión: ", error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tab 4</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 4</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ExploreContainer name="Tab 4 page" />
        <IonButton expand="full" onClick={handleLogout}>Cerrar Sesión</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Tab4;
