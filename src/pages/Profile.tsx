import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonAlert, IonAvatar, IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import ImageCompression from 'browser-image-compression';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { chevronBack } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { database } from '../configurations/firebase';
import './Profile.css';

const Profile = () => {
    const history = useHistory();
    const [profilePhoto, setProfilePhoto] = useState<string>('/assets/user.png');
    const [name, setName] = useState<string>('');
    const [surname1, setSurname1] = useState<string>('');
    const [surname2, setSurname2] = useState<string>('');
    const [alert, setAlert] = useState<string>('');
    const [showAlert, setShowAlert] = useState(false);

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
                    setSurname1(userData.surname_1);
                    setSurname2(userData.surname_2);
                }
            } catch (error) {
                console.error("Error al obtener los datos del usuario: ", error);
            }
        };

        fetchUserProfile();
    }, []);

    /* Seleccionamos una foto de perfil haciendo una foto con la cámara o escogiéndola de la galería */
    const handlePhoto = async () => {
        try {
            const photo = await Camera.getPhoto({
                resultType: CameraResultType.Uri,
                source: CameraSource.Prompt,
                quality: 90,
            });

            if (photo?.webPath) {
                const imageBlob = await fetch(photo.webPath).then(res => res.blob());
                const fileName = "profile-photo.jpg";
                const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                };

                const compressedImage = await ImageCompression(imageFile, options);

                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Image = reader.result as string;
                    setProfilePhoto(base64Image);
                };
                reader.readAsDataURL(compressedImage);
            }
        } catch (error) {
            console.error('Error al obtener o comprimir la foto:', error);
        }
    };

    /* Si el usuario no desea añadir una imagen personalizada, se pondrá una por defecto */
    const resetToDefaultPhoto = () => {
        setProfilePhoto('/assets/user.png');
    };

    /* Salvamos la imagen de perfil y el nombre del usuario en la base de datos */
    const handleSaveProfile = async () => {
        try {

            /* Obtenemos los datos del usuario autenticado */
            const auth = getAuth();
            const currentUser = auth.currentUser;

            /* Verificamos si el usuario está autenticado */
            if (!currentUser || !currentUser.uid) {
                throw new Error("El usuario no está autenticado.");
            }

            /* Marcamos como completo el formulario que debe realizar el usuario para configurar la cuenta principal para las transacciones y su divisa preferida */
            const usersRef = doc(database, "users", currentUser?.uid);

            await updateDoc(usersRef, {
                profile_photo: profilePhoto,
                name: name,
                surname_1: surname1,
                surname_2: surname2,
            });

            setAlert("Datos del perfil guardados correctamente.");
            setShowAlert(true);

        } catch (error) {
            setAlert("Error al guardar los datos del perfil. Por favor, inténtelo de nuevo.");
            setShowAlert(true);
        }
    }

    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButton slot="start" onClick={() => history.goBack()} fill='clear'>
                        <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                    <IonButton slot="end" onClick={handleSaveProfile} fill='clear'>
                        <FontAwesomeIcon icon={faFloppyDisk}></FontAwesomeIcon>
                    </IonButton>
                    <IonTitle>Perfil</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {showAlert && (<IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} message={alert} buttons={['Aceptar']} />)}
                <IonGrid className='account-setup-grid'>
                    <IonRow className='account-setup-row'>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <div className='account-setup-profile-photo-container'>
                                <IonAvatar className='account-setup-avatar'>
                                    <img src={profilePhoto} alt="Foto de perfil" />
                                </IonAvatar>
                                <IonButton expand="block" onClick={handlePhoto}>Cambiar foto</IonButton>
                                <IonButton expand="block" color="danger" onClick={resetToDefaultPhoto}>Eliminar foto</IonButton>
                            </div>
                        </IonCol>
                    </IonRow>
                    <IonRow className='account-setup-row'>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonInput={(e) => setName(e.detail.value!)} required />
                        </IonCol>
                    </IonRow>
                    <IonRow className='account-setup-row'>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonInput label='Primer apellido' labelPlacement='floating' placeholder='Primer apellido' value={surname1} onIonInput={(e) => setSurname1(e.detail.value!)} required />
                        </IonCol>
                    </IonRow>
                    <IonRow className='account-setup-row'>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonInput label='Segundo apellido' labelPlacement='floating' placeholder='Segundo apellido' value={surname2} onIonInput={(e) => setSurname2(e.detail.value!)} required />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default Profile;