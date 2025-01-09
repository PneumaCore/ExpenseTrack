import { faBell, faChartColumn, faCreditCard, faCreditCardAlt, faHome, faIcons, faSackDollar, faSignOut } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IonButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonTitle, IonToolbar } from "@ionic/react";
import { signOut } from "firebase/auth";
import { useHistory } from "react-router";
import { auth } from "../configurations/firebase";

const SideMenu: React.FC = () => {
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
        <IonMenu contentId="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>ExpenseTrack</IonTitle>
                    <IonButton slot="end" onClick={handleLogout} size="default" fill='clear'>
                        <FontAwesomeIcon icon={faSignOut}></FontAwesomeIcon>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    <IonMenuToggle auto-hide="true">
                        <IonItem onClick={() => history.push('/home', { from: window.location.pathname })}>
                            <div slot="start">
                                <FontAwesomeIcon icon={faHome}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Inicio</IonLabel>
                        </IonItem>
                        <IonItem onClick={() => history.push('/accounts', { from: window.location.pathname })}>
                            <div slot="start">
                                <FontAwesomeIcon icon={faSackDollar}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Cuentas</IonLabel>
                        </IonItem>
                        <IonItem onClick={() => history.push('/charts', { from: window.location.pathname })}>
                            <div slot="start">
                                <FontAwesomeIcon icon={faChartColumn}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Gráficos</IonLabel>
                        </IonItem>
                        <IonItem onClick={() => history.push('/categories', { from: window.location.pathname })}>
                            <div slot="start">
                                <FontAwesomeIcon icon={faIcons}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Categorías</IonLabel>
                        </IonItem>
                        <IonItem onClick={() => history.push('/notifications', { from: window.location.pathname })}>
                            <div slot="start">
                                <FontAwesomeIcon icon={faBell}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Recordatorios</IonLabel>
                        </IonItem>
                    </IonMenuToggle>
                </IonList>
            </IonContent>
        </IonMenu>
    );
}

export default SideMenu;