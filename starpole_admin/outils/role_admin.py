"""Donne ou retire le rôle d'administrateur de la console StarPole.

À lancer EN LOCAL uniquement, avec le compte de service Firebase (jamais dans Git) :

    python outils/role_admin.py donner  prenom.nom@exemple.com --cle C:/chemin/compte-service.json
    python outils/role_admin.py retirer prenom.nom@exemple.com --cle C:/chemin/compte-service.json
    python outils/role_admin.py voir    prenom.nom@exemple.com --cle C:/chemin/compte-service.json

Au lieu de --cle, on peut définir la variable GOOGLE_APPLICATION_CREDENTIALS.
Le compte doit déjà exister : connectez-vous une première fois à la console (Google
ou e-mail), puis lancez ce script. Reconnectez-vous ensuite pour que le rôle soit pris
en compte.

Dépendance : pip install firebase-admin
"""
import argparse
import os
import sys

import firebase_admin
from firebase_admin import auth, credentials


def main() -> int:
    analyseur = argparse.ArgumentParser(description="Rôle admin de la console StarPole")
    analyseur.add_argument("action", choices=["donner", "retirer", "voir"])
    analyseur.add_argument("email")
    analyseur.add_argument("--cle", help="Fichier JSON du compte de service Firebase")
    arguments = analyseur.parse_args()

    chemin = arguments.cle or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not chemin or not os.path.isfile(chemin):
        print("Fichier du compte de service introuvable (--cle ou GOOGLE_APPLICATION_CREDENTIALS).")
        return 1
    firebase_admin.initialize_app(credentials.Certificate(chemin))

    try:
        utilisateur = auth.get_user_by_email(arguments.email.strip().lower())
    except auth.UserNotFoundError:
        print("Aucun compte avec cette adresse. Connectez-vous d'abord une fois à la console.")
        return 1

    revendications = dict(utilisateur.custom_claims or {})
    if arguments.action == "voir":
        print(f"{utilisateur.email} : admin = {revendications.get('admin') is True}")
        return 0

    if arguments.action == "donner":
        revendications["admin"] = True
    else:
        revendications.pop("admin", None)
    auth.set_custom_user_claims(utilisateur.uid, revendications or None)
    # Force la reconnexion pour que le nouveau rôle soit appliqué partout.
    auth.revoke_refresh_tokens(utilisateur.uid)
    etat = "donné à" if arguments.action == "donner" else "retiré à"
    print(f"Rôle administrateur {etat} {utilisateur.email} (uid {utilisateur.uid}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
