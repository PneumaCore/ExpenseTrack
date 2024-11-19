import { IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useState } from 'react';
import AddTransaction from '../components/AddTransaction';
import SideMenu from '../components/SideMenu';
import './Tab1.css';

const Tab1: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <SideMenu />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton></IonMenuButton>
            </IonButtons>
            <IonTitle>Tab 1</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense">
            <IonToolbar>
              <IonTitle size="large">Tab 1</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonFab slot="fixed" vertical="bottom" horizontal="center">

            {/* Abrir el modal para añadir transacciones */}
            <IonFabButton onClick={() => setIsModalOpen(true)}>
              <IonIcon icon={add}></IonIcon>
            </IonFabButton>
          </IonFab>

          {/* Modal para añadir transacciones */}
          <AddTransaction isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}></AddTransaction>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Tab1;
