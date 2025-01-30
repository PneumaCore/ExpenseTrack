import { faArrowRightArrowLeft, faBell, faChartColumn, faGear, faHome, faIcons, faSackDollar, faSignOut } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IonAlert, IonAvatar, IonButton, IonCol, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonList, IonMenu, IonMenuToggle, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { getAuth, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { auth, database } from "../configurations/firebase";
import './SideMenu.css';

const SideMenu: React.FC = () => {
    const history = useHistory();
    const [profilePhoto, setProfilePhoto] = useState<string>('/assets/user.png');
    const [name, setName] = useState<string>('');
    const [showAlert, setShowAlert] = useState<boolean>(false);

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
                    <IonButton slot="end" onClick={() => setShowAlert(true)} size="default" fill='clear'>
                        <FontAwesomeIcon icon={faSignOut}></FontAwesomeIcon>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonMenuToggle auto-hide="true">
                    <div className="side-menu-profile-welcome-container">
                        <div className="side-menu-profile-welcome-avatar">
                            <IonAvatar>
                                <img src={profilePhoto} alt="Foto de perfil" />
                            </IonAvatar>
                        </div>
                        <div className="side-menu-profile-welcome-label">
                            <IonLabel>Bienvenido, <b>{name}</b></IonLabel>
                        </div>
                    </div>
                    <IonGrid>
                        <IonList className="side-menu-list">
                            <IonRow>
                                <IonCol>
                                    <IonItem onClick={() => history.push('/home', { from: window.location.pathname })}>
                                        <div slot="start">
                                            <FontAwesomeIcon icon={faHome}></FontAwesomeIcon>
                                        </div>
                                        <IonLabel><b>Inicio</b></IonLabel>
                                    </IonItem>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    <IonItem onClick={() => history.push('/accounts', { from: window.location.pathname })}>
                                        <div slot="start">
                                            <FontAwesomeIcon icon={faSackDollar}></FontAwesomeIcon>
                                        </div>
                                        <IonLabel><b>Cuentas</b></IonLabel>
                                    </IonItem>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    <IonItem onClick={() => history.push('/charts', { from: window.location.pathname })}>
                                        <div slot="start">
                                            <FontAwesomeIcon icon={faChartColumn}></FontAwesomeIcon>
                                        </div>
                                        <IonLabel><b>Gráficos</b></IonLabel>
                                    </IonItem>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    <IonItem onClick={() => history.push('/categories', { from: window.location.pathname })}>
                                        <div slot="start">
                                            <FontAwesomeIcon icon={faIcons}></FontAwesomeIcon>
                                        </div>
                                        <IonLabel><b>Categorías</b></IonLabel>
                                    </IonItem>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    <IonItem onClick={() => history.push('/transfers', { from: window.location.pathname })}>
                                        <div slot="start">
                                            <FontAwesomeIcon icon={faArrowRightArrowLeft}></FontAwesomeIcon>
                                        </div>
                                        <IonLabel><b>Transferencias</b></IonLabel>
                                    </IonItem>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    <IonItem onClick={() => history.push('/notifications', { from: window.location.pathname })}>
                                        <div slot="start">
                                            <FontAwesomeIcon icon={faBell}></FontAwesomeIcon>
                                        </div>
                                        <IonLabel><b>Recordatorios</b></IonLabel>
                                    </IonItem>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    <IonItem onClick={() => history.push('/settings', { from: window.location.pathname })}>
                                        <div slot="start">
                                            <FontAwesomeIcon icon={faGear}></FontAwesomeIcon>
                                        </div>
                                        <IonLabel><b>Ajustes</b></IonLabel>
                                    </IonItem>
                                </IonCol>
                            </IonRow>
                        </IonList>
                    </IonGrid>
                </IonMenuToggle>
            </IonContent>
            <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={'Cerrar sesión'} message={'¿Estás seguro de que quieres cerrar sesión?'} buttons={[{ text: 'Cancelar', role: 'cancel', handler: () => { setShowAlert(false); } }, { text: 'Cerrar sesión', handler: () => { handleLogout(); } }]} />
        </IonMenu>
    );
}

export default SideMenu;