import { IonContent, IonHeader, IonMenu, IonTitle, IonToolbar } from "@ionic/react";

const SideMenu: React.FC = () => {
    return (
        <IonMenu contentId="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Menú</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>

            </IonContent>
        </IonMenu>
    );
}

export default SideMenu;