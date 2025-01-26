import { LocalNotifications } from '@capacitor/local-notifications';
import { IonButton, IonCol, IonContent, IonDatetime, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonModal, IonPopover, IonRow, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import { deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { calendar, chevronBack } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { database } from '../configurations/firebase';
import './EditNotification.css';
import GlobalToast from './GlobalToast';

interface Notification {
    notification_id: string,
    user_id: string,
    name: string,
    frecuency: string,
    date: Timestamp,
    message: string,
    isActive: boolean
}

interface EditNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Notification | null;
}

const frecuencies: string[] = ['Una vez', 'Diariamente', 'Mensualmente', 'Anualmente'];

const EditNotification: React.FC<EditNotificationProps> = ({ isOpen, onClose, notification }) => {
    const [name, setName] = useState('');
    const [selectedFrecuency, setSelectedFrecuency] = useState<string | undefined>();
    const [selectedDate, setSelectedDate] = useState('');
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [message, setMessage] = useState('');

    /* Notificación global */
    const [toastConfig, setToastConfig] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ isOpen: false, message: '', type: 'error' });

    /* Actualizamos los campos con la información del recordatorio seleccionado */
        useEffect(() => {
            if (notification) {
                setName(notification.name);
                setSelectedFrecuency(notification.frecuency);
                setSelectedDate(notification.date.toDate().toISOString());
                setMessage(notification.message);
            }
        }, [notification]);

    /* Guardamos la fecha en el formato por defecto */
    const handleDateChange = (e: CustomEvent) => {
        setSelectedDate(e.detail.value!);
        setDatePickerOpen(false);
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

    const cancelNotification = async (notificationId: string) => {
        await LocalNotifications.cancel({ notifications: [{ id: parseInt(notificationId.slice(-6), 16) }] });
    };

    const handleSaveNotification = async () => {
        try {

            if (!notification?.notification_id) {
                throw new Error("El ID del recordatorio no está definido");
            }

            if (!selectedFrecuency) {
                throw new Error("Selecciona una frecuencia para el recordatorio");
            }

            const notificationsRef = doc(database, 'notifications', notification?.notification_id);

            /* Pasamos la fecha a Timestamp, ya que así la acepta Firestore */
            const dateObject = new Date(selectedDate);
            const dateTimestamp = Timestamp.fromDate(dateObject);

            const updateNotification = {
                name: name,
                frecuency: selectedFrecuency,
                date: dateTimestamp,
                message: message,
                isActive: true
            }

            /* Guardamos la cuenta editada en la base de datos */
            await updateDoc(notificationsRef, updateNotification);

            /* Si el recordatorio estaba activo, se elimina la notificación local y se crea nuevamente con los datos modificados */
            if (notification.isActive) {
                await cancelNotification(notification.notification_id);
                await scheduleNotification(notification.notification_id, name, message, dateObject, selectedFrecuency);
            }

            setToastConfig({ isOpen: true, message: 'Recordatorio editado con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al guardar el recordatorio */
            onClose();

        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo editar el recordatorio', type: 'error' });
        }
    };

    const handleDeleteNotification = async () => {
        try {

            if (!notification?.notification_id) {
                throw new Error("El ID del recordatorio no está definido");
            }

            const notificationsRef = doc(database, 'notifications', notification?.notification_id);

            /* Eliminamos el recordatorio de la base de datos */
            await deleteDoc(notificationsRef);

            if (notification.isActive) {
                await cancelNotification(notification.notification_id);
            }

            setToastConfig({ isOpen: true, message: 'Recordatorio eliminado con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al guardar el recordatorio */
            onClose();

        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo eliminar el recordatorio', type: 'error' });
        }
    }

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Editar recordatorio</IonTitle>
                        <IonButton slot="start" onClick={onClose} fill='clear'>
                            <IonIcon icon={chevronBack}></IonIcon>
                        </IonButton>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonGrid>

                        {/* Campo para añadir el nombre del recordatorio */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonChange={(e) => setName(e.detail.value!)} required />
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para seleccionar la frecuencia del recordatorio */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonSelect interface="popover" label="Frecuencia" labelPlacement="floating" placeholder="Selecciona la frecuencia" value={selectedFrecuency} onIonChange={(e) => setSelectedFrecuency(e.detail.value)}>
                                        {frecuencies.map((frecuency, index) => (
                                            <IonSelectOption key={index} value={frecuency}>
                                                {frecuency}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para seleccionar la fecha del recordatorio */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Fecha' labelPlacement='floating' placeholder='Selecciona una fecha' readonly value={selectedDate}></IonInput>

                                    {/* Abrir el popover para seleccionar la fecha de la transacción */}
                                    <IonIcon slot='end' icon={calendar} onClick={() => setDatePickerOpen(true)}></IonIcon>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para añadir el mensaje del recordatorio */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonTextarea label='Mensaje' labelPlacement='floating' placeholder='Introduce un mensaje' value={message} onIonChange={(e) => setMessage(e.detail.value!)}></IonTextarea>
                                </IonItem>
                            </IonCol>
                        </IonRow>
                    </IonGrid>

                    {/* Popover para seleccionar la fecha del recordatorio */}
                    {/* Cerrar el popover para seleccionar la fecha del recordatorio */}
                    <IonPopover isOpen={isDatePickerOpen} onDidDismiss={() => setDatePickerOpen(false)}>
                        <IonDatetime locale='es-ES' value={selectedDate} onIonChange={handleDateChange} />
                        <IonButton expand="block" onClick={() => setDatePickerOpen(false)}>Cerrar</IonButton>
                    </IonPopover>
                </IonContent>
                <IonFooter>
                    <IonToolbar>
                        <div className='add-notification-footer'>

                            {/* Botón para guardar el recordatorio */}
                            <IonButton onClick={handleSaveNotification}>Guardar recordatorio</IonButton>

                            {/* Botón para eliminar el recordatorio */}
                            <IonButton onClick={handleDeleteNotification} color={'danger'}>Eliminar recordatorio</IonButton>
                        </div>
                    </IonToolbar>
                </IonFooter>
            </IonModal>
            <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
        </>
    );
}

export default EditNotification;