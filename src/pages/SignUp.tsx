import { useState } from 'react';
import './SignUp.css';
import { useHistory } from 'react-router';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonLoading, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonIcon } from '@ionic/react';
import { chevronBack } from 'ionicons/icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../configurations/firebase';

const SignUp: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [repeatPassword, setRepeatPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const history = useHistory();

    /* Se registra con el correo y las contraseñas proporcionadas por el usuario, si el registro es exitoso, se le redirige a la pantalla de inicio de sesión */
    const handleSignUp = async () => {

        /* Se comprueba que ambas contraseñas coincidan */
        if (password !== repeatPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            history.push('/login');
        } catch (err: any) {
            setError(err.message);
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

                <IonGrid>

                    {/* Campo de error de registro */}
                    <IonRow className="signup-row">
                        <IonCol size="12" size-md="8" offset-md="2">
                            {error && <p className="error-message">{error}</p>}
                        </IonCol>
                    </IonRow>

                    {/* Campo de correo electrónico */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonInput label='Correo electrónico' labelPlacement='floating' placeholder='Correo electrónico' type="email" value={email} onIonChange={(e) => setEmail(e.detail.value!)} required />
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo de contraseña */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonInput label='Contraseña' labelPlacement='floating' placeholder='Contraseña' type="password" value={password} onIonChange={(e) => setPassword(e.detail.value!)} required />
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para repetir contraseña */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonInput label='Repetir contraseña' labelPlacement='floating' placeholder='Repetir contraseña' type="password" value={repeatPassword} onIonChange={(e) => setRepeatPassword(e.detail.value!)} required />
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Botón para registarse */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonButton expand="full" onClick={handleSignUp}>Registrarse</IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default SignUp;
