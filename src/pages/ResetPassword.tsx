import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonLoading, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { auth } from '../configurations/firebase';
import './ResetPassword.css';
import { chevronBack } from 'ionicons/icons';

const ResetPassword: React.FC = () => {
    const history = useHistory();
    const [isTouched, setIsTouched] = useState(false);
    const [isValid, setIsValid] = useState<boolean>();
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    /* Comprobamos si hay un usuario autenticado en la aplicación, si lo hay, rellenamos automáticamente el campo de correo electrónico (Esto en caso de acceder desde la pantalla de Ajustes) */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email) {
                setEmail(user.email);
            }
        });

        return () => unsubscribe();
    }, []);

    /* Comprobamos que el email sea válido */
    const validateEmail = (email: string) => {
        return email.match(
            /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        );
    };

    const validate = (event: Event) => {
        const value = (event.target as HTMLInputElement).value;

        setIsValid(undefined);

        if (value === '') return;

        validateEmail(value) !== null ? setIsValid(true) : setIsValid(false);
    };

    const markTouched = () => {
        setIsTouched(true);
    };

    /* Reseteamos la contraseña del usuario mediante su correo electrónico si se ha olvidado de su contraseña */
    const handleResetPassword = async () => {
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setError('Se ha enviado un enlace a tu correo electrónico para restablecer tu contraseña');
            setShowAlert(true);
        } catch (err: any) {
            setError('El correo electrónico es inválidos o no existe');
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>

                    {/* Si el usuario desea no restablecer contraseña, se le redirige nuevamente a la página de inicio de sesión */}
                    <IonButton slot="start" onClick={() => history.goBack()} fill='clear'>
                        <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                    <IonTitle>Restablecer contraseña</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {loading && <IonLoading isOpen={loading} message={'Enviando correo...'} />}
                {showAlert && (<IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={'Registro inválido'} message={error} buttons={['Aceptar']} />)}

                <IonGrid>

                    {/* Logo de la aplicación */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <div className='signup-image-container'>
                                <IonImg src='/assets/icon.png' className='signup-image'></IonImg>
                            </div>
                        </IonCol>
                    </IonRow>

                    {/* Campo de correo electrónico */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonInput className={`${isValid && 'ion-valid'} ${isValid === false && 'ion-invalid'} ${isTouched && 'ion-touched'}`} label='Correo electrónico' labelPlacement='floating' placeholder='Correo electrónico' type="email" value={email} onIonInput={(e) => { setEmail(e.detail.value!); validate(e); }} onIonBlur={() => markTouched()} required />
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Botón para restablecer contraseña */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonButton className='reset-password-button' expand='full' color='medium' shape='round' onClick={handleResetPassword}>Restablecer Contraseña</IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default ResetPassword;