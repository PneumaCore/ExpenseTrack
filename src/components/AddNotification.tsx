import { LocalNotifications } from '@capacitor/local-notifications';
import { IonButton, IonCol, IonContent, IonDatetime, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonModal, IonPopover, IonRow, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { calendar, chevronBack } from 'ionicons/icons';
import { useState } from 'react';
import { database } from '../configurations/firebase';
import './AddNotification.css';
import GlobalToast from './GlobalToast';

interface AddNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

const frecuencies: string[] = ['Una vez', 'Diariamente', 'Mensualmente', 'Trimestralmente', 'Semestralmente', 'Anualmente'];

const AddNotification: React.FC<AddNotificationProps> = ({ isOpen, onClose }) => {
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

    /* Guardamos la fecha en el formato por defecto */
    const handleDateChange = (e: CustomEvent) => {
        setSelectedDate(e.detail.value!);
        setDatePickerOpen(false);
    };

    /* Calculamos la fecha de la siguiente notificación en caso de repetirse más de una vez */
    const getNextNotificationDate = (frecuency: string, currentDate: Date) => {
        let nextDate = new Date(currentDate);

        switch (frecuency) {
            case 'Diariamente':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'Mensualmente':
                nextDate.setMonth(nextDate.getMonth() + 1);

                if (nextDate.getDate() !== currentDate.getDate()) {
                    nextDate.setDate(0);
                }
                break;
            case 'Trimestralmente':
                nextDate.setMonth(nextDate.getMonth() + 3);
                if (nextDate.getDate() !== currentDate.getDate()) {
                    nextDate.setDate(0);
                }
                break;
            case 'Semestralmente':
                nextDate.setMonth(nextDate.getMonth() + 6);
                if (nextDate.getDate() !== currentDate.getDate()) {
                    nextDate.setDate(0);
                }
                break;
            case 'Anualmente':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                if (nextDate.getDate() !== currentDate.getDate()) {
                    nextDate.setDate(0);
                }
                break;
            default:
                break;
        }

        return nextDate;
    };

    let notificationCounter = 0;

    const scheduleRecurrentNotification = async (startDate: Date, frecuency: string, notificationId: string) => {
        try {
            
            /* Pedimos al usuario que active los permisos de notificaciones en su teléfono */
            await LocalNotifications.requestPermissions();

            let notificationDate = new Date(startDate);

            const notificationLimit = 1;

            for (let i = 0; i < notificationLimit; i++) {
                const notification = {
                    id: notificationCounter++,
                    title: name,
                    body: message,
                    schedule: {
                        at: notificationDate,
                        repeats: frecuency !== 'Una vez',
                    },
                    sound: 'default',
                    actionTypeId: 'default',
                    extra: { id: notificationId },
                };

                await LocalNotifications.schedule({
                    notifications: [notification],
                });

                if (frecuency !== 'Una vez') {
                    notificationDate = getNextNotificationDate(frecuency, notificationDate);
                }
            }
        } catch (error) {
            console.error('No se pudo configurar el recordatorio', error);
        }
    };

    const handleSaveNotification = async () => {
        try {

            /* Obtenemos los datos del usuario autenticado */
            const auth = getAuth();
            const currentUser = auth.currentUser;

            /* Generamos un ID automático con Firestore */
            const notificationsRef = doc(collection(database, 'notifications'));
            const notificationId = notificationsRef.id;

            /* Pasamos la fecha a Timestamp, ya que así la acepta Firestore */
            const dateObject = new Date(selectedDate);
            const dateTimestamp = Timestamp.fromDate(dateObject);

            if (!selectedFrecuency) {
                throw new Error('Selecciona una frecuencia para el recordatorio');
            }

            const newNotification = {
                notification_id: notificationId,
                user_id: currentUser?.uid,
                name: name,
                frecuency: selectedFrecuency,
                date: dateTimestamp,
                message: message
            }

            /* Guardamos el recordatorio en la base de datos */
            await setDoc(notificationsRef, newNotification);

            /* Programamos una notificación local en el teléfono */
            await scheduleRecurrentNotification(dateTimestamp.toDate(), selectedFrecuency, notificationId);

            setToastConfig({ isOpen: true, message: 'Recordatorio añadido con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al guardar el recordatorio */
            onClose();

        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo añadir el recordatorio', type: 'error' });
        }
    };

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Añadir recordatorio</IonTitle>
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
                        </div>
                    </IonToolbar>
                </IonFooter>
            </IonModal>
            <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
        </>
    );
};

export default AddNotification;