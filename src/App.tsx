import {
  IonApp, IonIcon, IonLabel, IonLoading, IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs, setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { diamond, ellipse, notifications, square, triangle } from 'ionicons/icons';
import { Redirect, Route } from 'react-router-dom';
import LogIn from './pages/LogIn';
import SignUp from './pages/SignUp';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import Tab4 from './pages/Tab4';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import SideMenu from './components/SideMenu';
import { auth, database } from './configurations/firebase';
import Accounts from './pages/Accounts';
import AccountSetup from './pages/AccountSetup';
import Categories from './pages/Categories';
import './theme/variables.css';
import Notifications from './pages/Notifications';

setupIonicReact();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAccountSetup, setIsAccountSetup] = useState<boolean | null>(null);

  /* Se comprueba que haya un usuario autenticado en la aplicación */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);

        const userDocRef = doc(database, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {

          /* Comprobamos que el usuario haya realizado el formulario inicial para configurar la cuenta principal para las transacciones */
          const userData = userDoc.data();
          setIsAccountSetup(userData.isAccountSetup);
        } else {

          /* En caso de no existir el campo para realizar la comprobación, lo creamos */
          await setDoc(userDocRef, { uid: user.uid, isAccountSetup: false });
          setIsAccountSetup(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* Mientras se comprueba la autenticación del usuario, se le informa mediante un aviso de carga */
  if (isAuthenticated === null) {
    return <IonLoading isOpen={true} message={'Verificando autenticación...'} />;
  }

  return (
    <IonApp>
      <IonReactRouter>

        {/* Si el usuario está autenticado, aparecerá el menú deslizante solamente en el menú principal de la aplicación */}
        {isAuthenticated && <SideMenu />}

        {/* Si el usuario no está autenticado, se le redirige a la pantalla de inicio de sesión, si lo está, le lleva al menú principal de la aplicación */}
        <IonRouterOutlet id="main-content">
          {!isAuthenticated ? (
            <>
              <Route exact path="/signup" component={SignUp} />
              <Route exact path="/" render={() => <Redirect to="/login" />} />
              <Route exact path="/login" component={LogIn} />
            </>
          ) : (
            <>
              {/* Si el usuario no configurado una cuenta principal para las transacciones, se le redirige al formulario inicial para crear la cuenta principal */}
              {isAccountSetup === false && <Redirect to="/account_setup" />}

              {/* Ruta principal de la aplicación */}
              <Route exact path="/tab1" component={Tab1} />
              <Route exact path="/" render={() => <Redirect to="/tab1" />} />

              {/* Rutas independientes */}
              <Route path="/accounts" component={Accounts} />
              <Route path="/categories" component={Categories} />
              <Route path="/account_setup" component={AccountSetup} />
              <Route path="/notifications" component={Notifications} />
            </>
          )}
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
