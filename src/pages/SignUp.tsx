import { useState } from 'react';
import './SignUp.css';
import { useHistory } from 'react-router';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonLoading, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonIcon, IonAlert, IonImg } from '@ionic/react';
import { chevronBack, eye, eyeOff } from 'ionicons/icons';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../configurations/firebase';

const SignUp: React.FC = () => {
    const history = useHistory();
    const [isTouched, setIsTouched] = useState(false);
    const [isValid, setIsValid] = useState<boolean>();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [repeatPassword, setRepeatPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [showAlert, setShowAlert] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);

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

    /* Se registra con el correo y las contraseñas proporcionadas por el usuario, si el registro es exitoso, se le redirige a la pantalla de inicio de sesión */
    const handleSignUp = async () => {

        /* Se comprueba que ambas contraseñas coincidan */
        if (password !== repeatPassword) {
            setError('Las contraseñas no coinciden');
            setShowAlert(true);
            return;
        }

        setLoading(true);

        try {
            await createUserWithEmailAndPassword(auth, email, password);

            /* Cerramos la sesión del usuario que acaba de ser creado, ya que quiero forzarlo a pasar por la pantalla de inicio de sesión */
            await signOut(auth);

            history.push('/login');
        } catch (err: any) {
            setError("El correo electrónico o las contraseñas son inválidas");
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>

                    {/* Si el usuario desea no registrarse, se le redirige nuevamente a la página de inicio de sesión */}
                    <IonButton slot="start" onClick={() => history.goBack()} fill='clear'>
                        <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                    <IonTitle>Registrarse</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="signup-content">
                {loading && <IonLoading isOpen={loading} message={'Registrándose...'} />}
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

                    {/* Campo de contraseña */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonInput label='Contraseña' labelPlacement='floating' placeholder='Contraseña' type={showPassword ? "text" : "password"} value={password} onIonInput={(e) => setPassword(e.detail.value!)} required />
                                <IonButton slot="end" fill="clear" onClick={() => setShowPassword(!showPassword)}>
                                    <IonIcon icon={showPassword ? eye : eyeOff} />
                                </IonButton>
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para repetir contraseña */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonInput label='Repetir contraseña' labelPlacement='floating' placeholder='Repetir contraseña' type={showRepeatPassword ? "text" : "password"} value={repeatPassword} onIonInput={(e) => setRepeatPassword(e.detail.value!)} required />
                                <IonButton slot="end" fill="clear" onClick={() => setShowRepeatPassword(!showRepeatPassword)}>
                                    <IonIcon icon={showRepeatPassword ? eye : eyeOff} />
                                </IonButton>
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Botón para registarse */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonButton className='signup-button' expand="full" color="medium" shape='round' onClick={handleSignUp}>Registrarse</IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default SignUp;
