import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
  'required': 'Le champ {{ field }} est obligatoire.',
  'string': 'Le champ {{ field }} doit être une chaîne de caractères.',
  'email': "Le format de l'adresse email n'est pas valide.",
  'mobile': "Le format du numéro de téléphone n'est pas valide.",
  'number': 'Le champ {{ field }} doit être un nombre.',
  'boolean': 'Le champ {{ field }} doit être un booléen.',
  'date': 'Le format de la date est invalide (attendue: YYYY-MM-DD).',
  'enum': "La valeur sélectionnée pour {{ field }} n'est pas valide.",
  'minLength': 'Le champ {{ field }} doit contenir au moins {{ min }} caractères.',
  'maxLength': 'Le champ {{ field }} ne doit pas dépasser {{ max }} caractères.',
  'unique': "La valeur du champ {{ field }} est déjà utilisée dans le système.",
  'confirmed': 'La confirmation du champ {{ field }} ne correspond pas.',
  'database.unique': 'Cette valeur est déjà utilisée.'
})