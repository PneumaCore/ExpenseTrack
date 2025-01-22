import { faBell, faChartColumn, faCreditCard, faCreditCardAlt, faGear, faHome, faIcons, faSackDollar, faSignOut } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IonAvatar, IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { getAuth, signOut } from "firebase/auth";
import { useHistory } from "react-router";
import { auth, database } from "../configurations/firebase";
import './SideMenu.css'
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";

const SideMenu: React.FC = () => {
    const history = useHistory();
    const [profilePhoto, setProfilePhoto] = useState<string>('/assets/user.png');
    const [name, setName] = useState<string>('');
    /* Leemos la foto de perfil y el nombre del usuario de la base de datos */
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;

                const usersRef = collection(database, 'users');
                const q = query(usersRef, where('uid', '==', currentUser?.uid));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const userData = snapshot.docs[0].data();
                    setProfilePhoto(userData.profile_photo);
                    setName(userData.name);
                }
            } catch (error) {
                console.error("Error al obtener los datos del usuario: ", error);
            }
        };

        fetchUserProfile();
    }, []);

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
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <div className="side-menu-profile-welcome-container">
                                <div className="side-menu-profile-welcome-avatar">
                                    <IonAvatar>
                                        <img src={profilePhoto} alt="Foto de perfil" />
                                    </IonAvatar>
                                </div>
                                <div className="side-menu-profile-welcome-label">
                                    <IonLabel>Bienvenido, {name}</IonLabel>
                                </div>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                <IonList className="side-menu-list">
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
                        <IonItem onClick={() => history.push('/settings', { from: window.location.pathname })}>
                            <div slot="start">
                                <FontAwesomeIcon icon={faGear}></FontAwesomeIcon>
                            </div>
                            <IonLabel>Ajustes</IonLabel>
                        </IonItem>
                    </IonMenuToggle>
                </IonList>
            </IonContent>
        </IonMenu>
    );
}

export default SideMenu;