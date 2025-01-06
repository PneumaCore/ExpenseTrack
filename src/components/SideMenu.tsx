import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonTitle, IonToolbar } from "@ionic/react";
import { useHistory } from "react-router";

const SideMenu: React.FC = () => {
    const history = useHistory();
    return (
        <IonMenu contentId="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Menú</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    <IonMenuToggle auto-hide="true">
                        <IonItem onClick={() => history.push('/accounts', { from: window.location.pathname })}>
                            <IonLabel>Cuentas</IonLabel>
                        </IonItem>
                        <IonItem onClick={() => history.push('/categories', { from: window.location.pathname })}>
                            <IonLabel>Categorías</IonLabel>
                        </IonItem>
                        <IonItem onClick={() => history.push('/notifications', { from: window.location.pathname })}>
                            <IonLabel>Recordatorios</IonLabel>
                        </IonItem>
                    </IonMenuToggle>
                </IonList>
            </IonContent>
        </IonMenu>
    );
}

export default SideMenu;