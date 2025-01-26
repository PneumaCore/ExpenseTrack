import { LocalNotifications } from '@capacitor/local-notifications';
import { IonButtons, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonRow, IonTitle, IonToggle, IonToolbar } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { collection, doc, onSnapshot, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { add } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import AddNotification from '../components/AddNotification';
import EditNotification from '../components/EditNotification';
import { database } from '../configurations/firebase';
import './Notifications.css';

interface Notification {
    notification_id: string,
    user_id: string,
    name: string,
    frecuency: string,
    date: Timestamp,
    message: string,
    isActive: boolean
}

const Notifications: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

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

    const handleEditNotification = (notification: Notification) => {
        setSelectedNotification(notification);
        setIsEditModalOpen(true);
    };

    /* Creamos la notificación del sistema */
    const scheduleNotification = async (
        notificationId: string,
        title: string,
        body: string,
        triggerDate: Date,
        frecuency: string
    ) => {
        const scheduleConfig: { at: Date; repeats?: boolean; every?: 'day' | 'month' | 'year' } = { at: triggerDate };

        switch (frecuency) {
            case 'Diariamente':
                scheduleConfig.repeats = true;
                scheduleConfig.every = 'day';
                break;
            case 'Mensualmente':
                scheduleConfig.repeats = true;
                scheduleConfig.every = 'month';
                break;
            case 'Anualmente':
                scheduleConfig.repeats = true;
                scheduleConfig.every = 'year';
                break;
            default:
                break;
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    id: parseInt(notificationId.slice(-6), 16),
                    title,
                    body,
                    schedule: scheduleConfig,
                },
            ],
        });
    };

    /* Si activamos el toggle se vuelve a programar la notificación, si no, se elimina la notificación local */
    const handleToggleChange = async (notificationId: string, isActive: boolean) => {
        const notificationRef = doc(database, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            isActive: isActive
        });

        if (isActive) {
            const notification = notifications.find(n => n.notification_id === notificationId);
            if (notification) {
                await scheduleNotification(notificationId, notification.name, notification.message, new Date(notification.date.seconds * 1000), notification.frecuency);
            }
        } else {
            await cancelNotification(notificationId);
        }
    };

    const cancelNotification = async (notificationId: string) => {
        await LocalNotifications.cancel({ notifications: [{ id: parseInt(notificationId.slice(-6), 16) }] });
    };

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
                            <IonList className='notification-list'>
                                {notifications.length === 0 ? (
                                    <IonItem className="notification-message">
                                        <IonLabel>No hay recordatorios</IonLabel>
                                    </IonItem>
                                ) : (
                                    notifications.map((notification) => {
                                        return (
                                            <IonItem key={notification.notification_id} className="notification-item">
                                                <div style={{ backgroundColor: 'red' }} onClick={() => handleEditNotification(notification)}>
                                                    <IonLabel>{notification.name}</IonLabel>
                                                </div>
                                                <IonToggle slot='end' checked={notification.isActive} onIonChange={(e) => handleToggleChange(notification.notification_id, e.detail.checked)} />
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

                {/* Modal para editar o eliminar notificaciones */}
                <EditNotification isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} notification={selectedNotification}></EditNotification>
            </IonContent>
        </IonPage>
    );
};

export default Notifications;