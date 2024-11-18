import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import SideMenu from '../components/SideMenu';
import './Tab2.css';

const Tab2: React.FC = () => {
  return (
    <>
      <SideMenu />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton></IonMenuButton>
            </IonButtons>
            <IonTitle>Tab 2</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense">
            <IonToolbar>
              <IonTitle size="large">Tab 2</IonTitle>
            </IonToolbar>
          </IonHeader>
          <ExploreContainer name="Tab 2 page" />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Tab2;
