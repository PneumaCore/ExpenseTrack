import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonImg, IonLabel, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { useState } from 'react';
import './AccountSetup.css';

const AccountSetup: React.FC = () => {
  const [page, setPage] = useState(1);

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Account Setup</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid className='account-grid'>
          {page === 1 && (
            <>
              <IonRow className='account-row'>
                <IonCol>
                  <IonImg src='/assets/icon.png' className='account-image'></IonImg>
                </IonCol>
              </IonRow>
              <IonRow className='account-row'>
                <IonCol>
                  <h2>¡Bienvenido a ExpenseTrack!</h2>
                </IonCol>
              </IonRow>
              <IonRow className='account-row'>
                <IonCol>
                  <IonLabel>ExpenseTrack es una aplicación para controlar tus gastos e ingresos de manera sencilla.</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow className='account-row'>
                <IonCol>
                  <IonButton onClick={() => setPage(2)}>Comenzar</IonButton>
                </IonCol>
              </IonRow>
            </>
          )}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default AccountSetup;