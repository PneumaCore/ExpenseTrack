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

    const handleSignUp = async () => {
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

    const handleGoBack = () => {
        history.goBack();
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButton slot="start" onClick={handleGoBack} fill='clear'>
                        <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                    <IonTitle>Registrarse</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="signup-content">
                {loading && <IonLoading isOpen={loading} message={'Registrándose...'} />}

                <IonGrid>
                    <IonRow className="signup-row">
                        <IonCol size="12" size-md="8" offset-md="2">
                            {error && <p className="error-message">{error}</p>}
                            <IonItem>
                                <IonLabel position="floating">Correo electrónico</IonLabel>
                                <IonInput type="email" value={email} onIonChange={(e) => setEmail(e.detail.value!)} required />
                            </IonItem>
                            <IonItem>
                                <IonLabel position="floating">Contraseña</IonLabel>
                                <IonInput type="password" value={password} onIonChange={(e) => setPassword(e.detail.value!)} required />
                            </IonItem>
                            <IonItem>
                                <IonLabel position="floating">Repetir contraseña</IonLabel>
                                <IonInput type="password" value={repeatPassword} onIonChange={(e) => setRepeatPassword(e.detail.value!)} required />
                            </IonItem>
                            <IonButton expand="full" onClick={handleSignUp}>Registrarse</IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default SignUp;
