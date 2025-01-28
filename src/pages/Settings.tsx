import { IonButtons, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Settings.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDollar, faDatabase, faUser } from '@fortawesome/free-solid-svg-icons';

const Settings: React.FC = () => {
    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Ajustes</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid>
                    <IonList className='settings-list'>
                        <IonItem>
                            <div slot="start">
                                <FontAwesomeIcon icon={faUser}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Perfil</IonLabel>
                        </IonItem>
                        <IonItem>
                            <div slot="start">
                                <FontAwesomeIcon icon={faDatabase}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Datos</IonLabel>
                        </IonItem>
                        <IonItem>
                            <div slot="start">
                                <FontAwesomeIcon icon={faCommentDollar}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Divisa</IonLabel>
                        </IonItem>
                    </IonList>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
}

export default Settings;