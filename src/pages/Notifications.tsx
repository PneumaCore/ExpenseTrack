import { IonButtons, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { add } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import AddNotification from '../components/AddNotification';
import { database } from '../configurations/firebase';
import './Notifications.css';

interface Notification {
    notification_id: string,
    user_id: string,
    name: string,
    frecuency: string,
    date: Timestamp,
    message: string
}

const Notifications: React.FC = () => {
    const history = useHistory();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const fetchNotifications = () => {
            try {

                /* Obtenemos los datos del usuario autenticado */
                const auth = getAuth();
                const currentUser = auth.currentUser;

                /* Obtenemos los recordatorios asociados al usuario autenticado */
                const transactionsRef = collection(database, 'notifications');
                const q = query(transactionsRef, where('user_id', '==', currentUser?.uid));

                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const fetchedNotifications = querySnapshot.docs.map((doc) => ({
                        ...doc.data(),
                        notification_id: doc.id,
                    })) as Notification[];
                    setNotifications(fetchedNotifications);
                });
                return unsubscribe;

            } catch (error) {
                console.error("Error al obtener las transacciones: ", error);
            }
        };
        const unsubscribe = fetchNotifications();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Recordatorios</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid>

                    {/* Listado de recordatorios */}
                    <IonRow>
                        <IonCol>
                            <IonList>
                                {notifications.length === 0 ? (
                                    <IonItem className="notification-message">
                                        <IonLabel>No hay recordatorios</IonLabel>
                                    </IonItem>
                                ) : (
                                    notifications.map((notification) => {
                                        return (
                                            <IonItem key={notification.notification_id} className="notification-item">
                                                <IonLabel>{notification.name}</IonLabel>
                                            </IonItem>
                                        );
                                    })
                                )}
                            </IonList>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                <IonFab slot="fixed" vertical="bottom" horizontal="center">

                    {/* Abrir el modal para añadir cuentas */}
                    <IonFabButton onClick={() => setIsAddModalOpen(true)}>
                        <IonIcon icon={add}></IonIcon>
                    </IonFabButton>
                </IonFab>

                {/* Modal para añadir cuentas */}
                <AddNotification isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}></AddNotification>
            </IonContent>
        </IonPage>
    );
};

export default Notifications;