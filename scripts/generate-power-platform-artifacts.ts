import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_ROOT = 'power-platform';

const FLOW_SPECS = [
  {
    slug: 'AC-247-nouvel-email-entrant',
    displayName: 'AC - 24/7 - Nouvel email entrant',
    description: 'Traite chaque nouvel email Outlook entrant, crée uniquement des brouillons et journalise la décision.',
    category: 'realtime',
    buildDefinition: buildRealtimeDefinition
  },
  {
    slug: 'AC-rattrapage-emails-recents',
    displayName: 'AC - Rattrapage emails récents',
    description: 'Rattrape toutes les deux heures les emails récents non journalisés.',
    category: 'recentCatchup',
    buildDefinition: buildRecentCatchupDefinition
  },
  {
    slug: 'AC-nettoyage-historique',
    displayName: 'AC - Nettoyage historique',
    description: 'Traite l’historique par lots, en simulation par défaut, avec rapport Teams groupé.',
    category: 'historicalCleanup',
    buildDefinition: buildHistoricalCleanupDefinition
  },
  {
    slug: 'AC-resume-hebdomadaire',
    displayName: 'AC - Résumé hebdomadaire commercial',
    description: 'Publie chaque lundi matin une synthèse commerciale Teams.',
    category: 'weeklySummary',
    buildDefinition: buildWeeklySummaryDefinition
  },
  {
    slug: 'AC-quarantaine-expiration',
    displayName: 'AC - Quarantaine expiration',
    description: 'Produit un rapport de revue humaine pour les emails en quarantaine depuis plus de 30 jours.',
    category: 'quarantineReview',
    buildDefinition: buildQuarantineReviewDefinition
  }
];

const REALTIME_SCHEMA = {
  type: 'object',
  properties: {
    mode: { type: 'string' },
    categorie: { type: 'string' },
    scorePriorite: { type: 'integer' },
    niveauConfiance: { type: 'integer' },
    raisonDecision: { type: 'string' },
    actionRecommandee: { type: 'string' },
    dossierDestination: { type: 'string' },
    brouillonNecessaire: { type: 'boolean' },
    alerteTeamsNecessaire: { type: 'boolean' },
    questionTeamsNecessaire: { type: 'boolean' },
    resumeEmail: { type: 'string' },
    texteBrouillon: { type: 'string' },
    questionTeams: { type: 'string' },
    risquesDetectes: { type: 'array', items: { type: 'string' } },
    motsClesSensiblesDetectes: { type: 'array', items: { type: 'string' } }
  },
  required: ['mode', 'categorie', 'scorePriorite', 'niveauConfiance', 'dossierDestination', 'brouillonNecessaire']
};

const HISTORICAL_SCHEMA = {
  type: 'object',
  properties: {
    mode: { type: 'string' },
    categorie: { type: 'string' },
    scorePriorite: { type: 'integer' },
    scoreObsolescence: { type: 'integer' },
    niveauConfiance: { type: 'integer' },
    raisonDecision: { type: 'string' },
    actionRecommandee: { type: 'string' },
    dossierDestination: { type: 'string' },
    brouillonNecessaire: { type: 'boolean' },
    alerteTeamsImmediate: { type: 'boolean' },
    inclureRapportNettoyage: { type: 'boolean' },
    resumeEmail: { type: 'string' },
    texteBrouillon: { type: 'string' },
    questionPourJeremy: { type: 'string' },
    risquesDetectes: { type: 'array', items: { type: 'string' } },
    motsClesSensiblesDetectes: { type: 'array', items: { type: 'string' } }
  },
  required: ['mode', 'categorie', 'scorePriorite', 'scoreObsolescence', 'niveauConfiance', 'dossierDestination']
};

function commonParameters() {
  return {
    '$authentication': { defaultValue: {}, type: 'SecureObject' },
    '$connections': { defaultValue: {}, type: 'Object' },
    GRAPH_BASE_URL: { defaultValue: 'https://graph.microsoft.com/v1.0', type: 'String' },
    USER_ID_OR_UPN: { defaultValue: '{USER_ID_OR_UPN}', type: 'String' },
    TENANT_ID: { defaultValue: '{TENANT_ID}', type: 'String' },
    CLIENT_ID: { defaultValue: '{CLIENT_ID}', type: 'String' },
    CLIENT_SECRET: { defaultValue: '{CLIENT_SECRET}', type: 'SecureString' },
    DATAVERSE_ORG_URL: { defaultValue: 'https://{environment}.crm.dynamics.com', type: 'String' },
    TEAMS_WEBHOOK_URL: { defaultValue: '{TEAMS_WEBHOOK_URL}', type: 'SecureString' },
    COPILOT_REALTIME_ENDPOINT: { defaultValue: '{COPILOT_REALTIME_ENDPOINT}', type: 'String' },
    COPILOT_HISTORICAL_ENDPOINT: { defaultValue: '{COPILOT_HISTORICAL_ENDPOINT}', type: 'String' },
    MODE_SIMULATION_HISTORIQUE: { defaultValue: true, type: 'Bool' },
    DEFAULT_TIMEZONE: { defaultValue: 'Europe/Paris', type: 'String' }
  };
}

function workflowDefinition(triggers, actions, outputs = {}) {
  return {
    '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#',
    contentVersion: '1.0.0.0',
    parameters: commonParameters(),
    triggers,
    actions,
    outputs
  };
}

function graphAuth() {
  return {
    type: 'ActiveDirectoryOAuth',
    tenant: "@parameters('TENANT_ID')",
    audience: 'https://graph.microsoft.com',
    clientId: "@parameters('CLIENT_ID')",
    secret: "@parameters('CLIENT_SECRET')"
  };
}

function dataverseAuth() {
  return {
    type: 'ActiveDirectoryOAuth',
    tenant: "@parameters('TENANT_ID')",
    audience: "@parameters('DATAVERSE_ORG_URL')",
    clientId: "@parameters('CLIENT_ID')",
    secret: "@parameters('CLIENT_SECRET')"
  };
}

function httpAction(method, uri, body, authentication = graphAuth(), headers = {}) {
  const action = {
    type: 'Http',
    inputs: {
      method,
      uri,
      headers: {
        Accept: 'application/json',
        ...headers
      },
      authentication
    },
    runtimeConfiguration: {
      contentTransfer: {
        transferMode: 'Chunked'
      }
    }
  };

  if (body !== undefined) {
    action.inputs.headers['Content-Type'] = 'application/json';
    action.inputs.body = body;
  }

  return action;
}

function composeAction(inputs) {
  return {
    type: 'Compose',
    inputs
  };
}

function initializeVariable(name, type, value) {
  return {
    type: 'InitializeVariable',
    inputs: {
      variables: [
        {
          name,
          type,
          value
        }
      ]
    }
  };
}

function parseJsonAction(content, schema) {
  return {
    type: 'ParseJson',
    inputs: {
      content,
      schema
    }
  };
}

function outlookNewEmailTrigger() {
  return {
    When_a_new_email_arrives_V3: {
      type: 'OpenApiConnectionNotification',
      inputs: {
        host: {
          apiId: '/providers/Microsoft.PowerApps/apis/shared_office365',
          connectionName: 'shared_office365',
          operationId: 'OnNewEmailV3'
        },
        parameters: {
          folderPath: 'Inbox',
          importance: 'Any',
          fetchOnlyWithAttachment: false,
          includeAttachments: false
        },
        authentication: "@parameters('$authentication')"
      },
      splitOn: "@triggerOutputs()?['body/value']"
    }
  };
}

function recurrenceTrigger(frequency, interval, extra = {}) {
  return {
    Recurrence: {
      type: 'Recurrence',
      recurrence: {
        frequency,
        interval,
        ...extra
      }
    }
  };
}

function manualButtonTrigger(schema) {
  return {
    Manual: {
      type: 'Request',
      kind: 'Button',
      inputs: {
        schema
      }
    }
  };
}

function buildRealtimeDefinition() {
  const actions = {
    Initialize_MessageId: initializeVariable('MessageId', 'string', "@{coalesce(triggerOutputs()?['body/id'], triggerOutputs()?['body/internetMessageId'])}"),
    Graph_Get_Message: {
      ...httpAction('GET', "@{concat(parameters('GRAPH_BASE_URL'), '/users/', parameters('USER_ID_OR_UPN'), '/messages/', variables('MessageId'), '?$select=id,conversationId,internetMessageId,receivedDateTime,from,subject,bodyPreview,body,hasAttachments,webLink,categories')}")
    },
    Dataverse_Check_EmailLog: {
      ...httpAction('GET', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_emaillogs?$select=ac_messageid&$filter=ac_messageid eq ''', variables('MessageId'), '''')}", undefined, dataverseAuth())
    },
    If_Message_Already_Logged: {
      type: 'If',
      expression: {
        greater: [
          "@length(coalesce(body('Dataverse_Check_EmailLog')?['value'], createArray()))",
          0
        ]
      },
      actions: {
        Terminate_Already_Processed: {
          type: 'Terminate',
          inputs: {
            runStatus: 'Succeeded',
            runError: {
              code: 'AlreadyProcessed',
              message: 'MessageId déjà journalisé.'
            }
          }
        }
      },
      else: {
        actions: {
          Call_Copilot_Realtime_Agent: httpAction('POST', "@parameters('COPILOT_REALTIME_ENDPOINT')", {
            message: "@body('Graph_Get_Message')",
            mode: 'realtime'
          }, {
            type: 'Raw',
            value: '@parameters(\'CLIENT_SECRET\')'
          }),
          Parse_JSON_Agent: {
            ...parseJsonAction("@body('Call_Copilot_Realtime_Agent')", REALTIME_SCHEMA),
            runAfter: {
              Call_Copilot_Realtime_Agent: ['Succeeded']
            }
          },
          Compose_Dossier_Destination_Final: {
            ...composeAction("@if(less(int(body('Parse_JSON_Agent')?['niveauConfiance']), 80), '04 - À surveiller', body('Parse_JSON_Agent')?['dossierDestination'])"),
            runAfter: {
              Parse_JSON_Agent: ['Succeeded']
            }
          },
          If_Create_Draft: {
            type: 'If',
            expression: {
              equals: [
                "@body('Parse_JSON_Agent')?['brouillonNecessaire']",
                true
              ]
            },
            actions: {
              Graph_Create_Reply_Draft: httpAction('POST', "@{concat(parameters('GRAPH_BASE_URL'), '/users/', parameters('USER_ID_OR_UPN'), '/messages/', variables('MessageId'), '/createReply')}", {
                message: {
                  body: {
                    contentType: 'HTML',
                    content: "@body('Parse_JSON_Agent')?['texteBrouillon']"
                  }
                }
              })
            },
            else: {
              actions: {
                Compose_No_Draft: composeAction('Aucun brouillon requis.')
              }
            },
            runAfter: {
              Compose_Dossier_Destination_Final: ['Succeeded']
            }
          },
          Graph_Move_Message: {
            ...httpAction('POST', "@{concat(parameters('GRAPH_BASE_URL'), '/users/', parameters('USER_ID_OR_UPN'), '/messages/', variables('MessageId'), '/move')}", {
              destinationId: "@outputs('Compose_Dossier_Destination_Final')"
            }),
            runAfter: {
              If_Create_Draft: ['Succeeded']
            }
          },
          If_Teams_Alert: {
            type: 'If',
            expression: {
              or: [
                {
                  equals: [
                    "@body('Parse_JSON_Agent')?['alerteTeamsNecessaire']",
                    true
                  ]
                },
                {
                  equals: [
                    "@body('Parse_JSON_Agent')?['questionTeamsNecessaire']",
                    true
                  ]
                }
              ]
            },
            actions: {
              Teams_Post_Adaptive_Card_Webhook: httpAction('POST', "@parameters('TEAMS_WEBHOOK_URL')", {
                type: 'message',
                attachments: [
                  {
                    contentType: 'application/vnd.microsoft.card.adaptive',
                    content: '@body(\'Parse_JSON_Agent\')'
                  }
                ]
              }, { type: 'Raw', value: '' })
            },
            else: {
              actions: {
                Compose_No_Teams_Alert: composeAction('Aucune alerte Teams nécessaire.')
              }
            },
            runAfter: {
              Graph_Move_Message: ['Succeeded']
            }
          },
          Dataverse_Create_EmailLog: {
            ...httpAction('POST', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_emaillogs')}", {
              ac_messageid: "@variables('MessageId')",
              ac_conversationid: "@body('Graph_Get_Message')?['conversationId']",
              ac_categorie: "@body('Parse_JSON_Agent')?['categorie']",
              ac_scorepriorite: "@body('Parse_JSON_Agent')?['scorePriorite']",
              ac_niveauconfiance: "@body('Parse_JSON_Agent')?['niveauConfiance']",
              ac_raisondecision: "@body('Parse_JSON_Agent')?['raisonDecision']",
              ac_dossierdestination: "@outputs('Compose_Dossier_Destination_Final')",
              ac_brouilloncree: "@body('Parse_JSON_Agent')?['brouillonNecessaire']",
              ac_teamsalerteenvoyee: "@or(body('Parse_JSON_Agent')?['alerteTeamsNecessaire'], body('Parse_JSON_Agent')?['questionTeamsNecessaire'])",
              ac_datetraitement: "@utcNow()"
            }, dataverseAuth()),
            runAfter: {
              If_Teams_Alert: ['Succeeded']
            }
          }
        }
      },
      runAfter: {
        Dataverse_Check_EmailLog: ['Succeeded']
      }
    }
  };

  actions.Graph_Get_Message.runAfter = { Initialize_MessageId: ['Succeeded'] };
  actions.Dataverse_Check_EmailLog.runAfter = { Graph_Get_Message: ['Succeeded'] };

  return workflowDefinition(outlookNewEmailTrigger(), actions);
}

function buildRecentCatchupDefinition() {
  const actions = {
    Initialize_FenetreHeures: initializeVariable('FenetreHeures', 'integer', 24),
    Compose_Date_Depuis: {
      ...composeAction("@formatDateTime(addHours(utcNow(), mul(-1, variables('FenetreHeures'))), 'yyyy-MM-ddTHH:mm:ssZ')"),
      runAfter: {
        Initialize_FenetreHeures: ['Succeeded']
      }
    },
    Graph_List_Recent_Inbox: {
      ...httpAction('GET', "@{concat(parameters('GRAPH_BASE_URL'), '/users/', parameters('USER_ID_OR_UPN'), '/mailFolders/inbox/messages?$top=50&$orderby=receivedDateTime desc&$filter=receivedDateTime ge ', outputs('Compose_Date_Depuis'))}"),
      runAfter: {
        Compose_Date_Depuis: ['Succeeded']
      }
    },
    Apply_To_Each_Recent_Message: {
      type: 'Foreach',
      foreach: "@body('Graph_List_Recent_Inbox')?['value']",
      actions: {
        Dataverse_Check_EmailLog: httpAction('GET', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_emaillogs?$select=ac_messageid&$filter=ac_messageid eq ''', items('Apply_To_Each_Recent_Message')?['id'], '''')}", undefined, dataverseAuth()),
        If_Not_Logged: {
          type: 'If',
          expression: {
            equals: [
              "@length(coalesce(body('Dataverse_Check_EmailLog')?['value'], createArray()))",
              0
            ]
          },
          actions: {
            Call_Copilot_Realtime_Agent: httpAction('POST', "@parameters('COPILOT_REALTIME_ENDPOINT')", {
              message: "@items('Apply_To_Each_Recent_Message')",
              mode: 'realtime'
            }, { type: 'Raw', value: '@parameters(\'CLIENT_SECRET\')' }),
            Parse_JSON_Agent: {
              ...parseJsonAction("@body('Call_Copilot_Realtime_Agent')", REALTIME_SCHEMA),
              runAfter: {
                Call_Copilot_Realtime_Agent: ['Succeeded']
              }
            },
            Graph_Move_Message: {
              ...httpAction('POST', "@{concat(parameters('GRAPH_BASE_URL'), '/users/', parameters('USER_ID_OR_UPN'), '/messages/', items('Apply_To_Each_Recent_Message')?['id'], '/move')}", {
                destinationId: "@body('Parse_JSON_Agent')?['dossierDestination']"
              }),
              runAfter: {
                Parse_JSON_Agent: ['Succeeded']
              }
            },
            Dataverse_Create_EmailLog: {
              ...httpAction('POST', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_emaillogs')}", {
                ac_messageid: "@items('Apply_To_Each_Recent_Message')?['id']",
                ac_categorie: "@body('Parse_JSON_Agent')?['categorie']",
                ac_scorepriorite: "@body('Parse_JSON_Agent')?['scorePriorite']",
                ac_niveauconfiance: "@body('Parse_JSON_Agent')?['niveauConfiance']",
                ac_raisondecision: "@body('Parse_JSON_Agent')?['raisonDecision']",
                ac_dossierdestination: "@body('Parse_JSON_Agent')?['dossierDestination']",
                ac_datetraitement: "@utcNow()"
              }, dataverseAuth()),
              runAfter: {
                Graph_Move_Message: ['Succeeded']
              }
            }
          },
          else: {
            actions: {
              Compose_Already_Logged: composeAction('Message déjà traité.')
            }
          },
          runAfter: {
            Dataverse_Check_EmailLog: ['Succeeded']
          }
        }
      },
      runAfter: {
        Graph_List_Recent_Inbox: ['Succeeded']
      }
    }
  };

  return workflowDefinition(recurrenceTrigger('Hour', 2), actions);
}

function buildHistoricalCleanupDefinition() {
  const actions = {
    Initialize_BatchId: initializeVariable('BatchId', 'string', '@guid()'),
    Initialize_ModeSimulation: {
      ...initializeVariable('ModeSimulation', 'boolean', "@coalesce(triggerBody()?['modeSimulation'], parameters('MODE_SIMULATION_HISTORIQUE'))"),
      runAfter: {
        Initialize_BatchId: ['Succeeded']
      }
    },
    Initialize_TailleLot: {
      ...initializeVariable('TailleLot', 'integer', "@coalesce(triggerBody()?['tailleLot'], 50)"),
      runAfter: {
        Initialize_ModeSimulation: ['Succeeded']
      }
    },
    Graph_List_Inbox_Batch: {
      ...httpAction('GET', "@{concat(parameters('GRAPH_BASE_URL'), '/users/', parameters('USER_ID_OR_UPN'), '/mailFolders/inbox/messages?$top=', variables('TailleLot'), '&$orderby=receivedDateTime asc') }"),
      runAfter: {
        Initialize_TailleLot: ['Succeeded']
      }
    },
    Apply_To_Each_Historical_Message: {
      type: 'Foreach',
      foreach: "@body('Graph_List_Inbox_Batch')?['value']",
      actions: {
        Dataverse_Check_Historical_Log: httpAction('GET', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_historicalcleanups?$select=ac_messageid&$filter=ac_messageid eq ''', items('Apply_To_Each_Historical_Message')?['id'], '''')}", undefined, dataverseAuth()),
        If_Not_Already_Handled: {
          type: 'If',
          expression: {
            equals: [
              "@length(coalesce(body('Dataverse_Check_Historical_Log')?['value'], createArray()))",
              0
            ]
          },
          actions: {
            Call_Copilot_Historical_Agent: httpAction('POST', "@parameters('COPILOT_HISTORICAL_ENDPOINT')", {
              batchId: "@variables('BatchId')",
              modeSimulation: "@variables('ModeSimulation')",
              message: "@items('Apply_To_Each_Historical_Message')"
            }, { type: 'Raw', value: '@parameters(\'CLIENT_SECRET\')' }),
            Parse_JSON_Historical_Agent: {
              ...parseJsonAction("@body('Call_Copilot_Historical_Agent')", HISTORICAL_SCHEMA),
              runAfter: {
                Call_Copilot_Historical_Agent: ['Succeeded']
              }
            },
            If_Simulation_Mode: {
              type: 'If',
              expression: {
                equals: [
                  "@variables('ModeSimulation')",
                  true
                ]
              },
              actions: {
                Compose_Simulation_Only: composeAction('Simulation: aucun déplacement et aucun brouillon.')
              },
              else: {
                actions: {
                  Graph_Move_Historical_Message: httpAction('POST', "@{concat(parameters('GRAPH_BASE_URL'), '/users/', parameters('USER_ID_OR_UPN'), '/messages/', items('Apply_To_Each_Historical_Message')?['id'], '/move')}", {
                    destinationId: "@body('Parse_JSON_Historical_Agent')?['dossierDestination']"
                  })
                }
              },
              runAfter: {
                Parse_JSON_Historical_Agent: ['Succeeded']
              }
            },
            Dataverse_Create_Historical_Log: {
              ...httpAction('POST', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_historicalcleanups')}", {
                ac_messageid: "@items('Apply_To_Each_Historical_Message')?['id']",
                ac_batchid: "@variables('BatchId')",
                ac_categorie: "@body('Parse_JSON_Historical_Agent')?['categorie']",
                ac_scorepriorite: "@body('Parse_JSON_Historical_Agent')?['scorePriorite']",
                ac_scoreobsolescence: "@body('Parse_JSON_Historical_Agent')?['scoreObsolescence']",
                ac_niveauconfiance: "@body('Parse_JSON_Historical_Agent')?['niveauConfiance']",
                ac_raisondecision: "@body('Parse_JSON_Historical_Agent')?['raisonDecision']",
                ac_dossierdestination: "@body('Parse_JSON_Historical_Agent')?['dossierDestination']",
                ac_statut: "@if(variables('ModeSimulation'), 'Simulation', 'Déplacé')",
                ac_datetraitement: "@utcNow()"
              }, dataverseAuth()),
              runAfter: {
                If_Simulation_Mode: ['Succeeded']
              }
            }
          },
          else: {
            actions: {
              Compose_Historical_Already_Logged: composeAction('MessageId déjà présent dans les logs historiques.')
            }
          },
          runAfter: {
            Dataverse_Check_Historical_Log: ['Succeeded']
          }
        }
      },
      runAfter: {
        Graph_List_Inbox_Batch: ['Succeeded']
      }
    },
    Teams_Post_Grouped_Report: {
      ...httpAction('POST', "@parameters('TEAMS_WEBHOOK_URL')", {
        type: 'message',
        text: "@{concat('Rapport nettoyage historique - lot ', variables('BatchId'))}"
      }, { type: 'Raw', value: '' }),
      runAfter: {
        Apply_To_Each_Historical_Message: ['Succeeded']
      }
    }
  };

  return workflowDefinition(manualButtonTrigger({
    type: 'object',
    properties: {
      periode: { type: 'string' },
      tailleLot: { type: 'integer' },
      modeSimulation: { type: 'boolean', default: true },
      creationBrouillons: { type: 'boolean', default: false },
      alertesTeamsGroupees: { type: 'boolean', default: true }
    }
  }), actions);
}

function buildWeeklySummaryDefinition() {
  const actions = {
    Compose_Date_Depuis: composeAction("@formatDateTime(addDays(utcNow(), -7), 'yyyy-MM-ddTHH:mm:ssZ')"),
    Dataverse_Read_EmailLog: {
      ...httpAction('GET', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_emaillogs?$filter=ac_datetraitement ge ', outputs('Compose_Date_Depuis'))}", undefined, dataverseAuth()),
      runAfter: {
        Compose_Date_Depuis: ['Succeeded']
      }
    },
    Dataverse_Read_Historical_Log: {
      ...httpAction('GET', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_historicalcleanups?$filter=ac_datetraitement ge ', outputs('Compose_Date_Depuis'))}", undefined, dataverseAuth()),
      runAfter: {
        Dataverse_Read_EmailLog: ['Succeeded']
      }
    },
    Compose_Weekly_Summary: {
      ...composeAction({
        periode: '7 derniers jours',
        emailsTempsReel: "@length(coalesce(body('Dataverse_Read_EmailLog')?['value'], createArray()))",
        emailsHistoriques: "@length(coalesce(body('Dataverse_Read_Historical_Log')?['value'], createArray()))",
        note: 'Synthèse à enrichir dans Teams avec la carte teams/adaptive-cards/resume-hebdomadaire.json.'
      }),
      runAfter: {
        Dataverse_Read_Historical_Log: ['Succeeded']
      }
    },
    Teams_Post_Weekly_Summary: {
      ...httpAction('POST', "@parameters('TEAMS_WEBHOOK_URL')", {
        type: 'message',
        text: "@string(outputs('Compose_Weekly_Summary'))"
      }, { type: 'Raw', value: '' }),
      runAfter: {
        Compose_Weekly_Summary: ['Succeeded']
      }
    }
  };

  return workflowDefinition(recurrenceTrigger('Week', 1, {
    schedule: {
      hours: ['8'],
      minutes: [0],
      weekDays: ['Monday']
    },
    timeZone: 'Romance Standard Time'
  }), actions);
}

function buildQuarantineReviewDefinition() {
  const actions = {
    Compose_Date_Seuil: composeAction("@formatDateTime(addDays(utcNow(), -30), 'yyyy-MM-ddTHH:mm:ssZ')"),
    Dataverse_Read_Realtime_Quarantine: {
      ...httpAction('GET', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_emaillogs?$filter=ac_dossierdestination eq ''06 - À supprimer - quarantaine'' and ac_datetraitement le ', outputs('Compose_Date_Seuil'))}", undefined, dataverseAuth()),
      runAfter: {
        Compose_Date_Seuil: ['Succeeded']
      }
    },
    Dataverse_Read_Historical_Quarantine: {
      ...httpAction('GET', "@{concat(parameters('DATAVERSE_ORG_URL'), '/api/data/v9.2/ac_historicalcleanups?$filter=ac_dossierdestination eq ''Historique - Quarantaine suppression'' and ac_datetraitement le ', outputs('Compose_Date_Seuil'))}", undefined, dataverseAuth()),
      runAfter: {
        Dataverse_Read_Realtime_Quarantine: ['Succeeded']
      }
    },
    Compose_Quarantine_Report: {
      ...composeAction({
        titre: 'Rapport quarantaine à revue humaine',
        tempsReel: "@length(coalesce(body('Dataverse_Read_Realtime_Quarantine')?['value'], createArray()))",
        historique: "@length(coalesce(body('Dataverse_Read_Historical_Quarantine')?['value'], createArray()))",
        note: 'Aucune suppression directe n’est effectuée par ce flow.'
      }),
      runAfter: {
        Dataverse_Read_Historical_Quarantine: ['Succeeded']
      }
    },
    Teams_Post_Quarantine_Report: {
      ...httpAction('POST', "@parameters('TEAMS_WEBHOOK_URL')", {
        type: 'message',
        text: "@string(outputs('Compose_Quarantine_Report'))"
      }, { type: 'Raw', value: '' }),
      runAfter: {
        Compose_Quarantine_Report: ['Succeeded']
      }
    }
  };

  return workflowDefinition(recurrenceTrigger('Day', 1), actions);
}

function buildClientData(definition, spec) {
  return {
    properties: {
      apiId: `/providers/Microsoft.ProcessSimple/environments/{ENVIRONMENT_NAME}/flows/${spec.slug}`,
      displayName: spec.displayName,
      definition,
      connectionReferences: buildConnectionReferences(definition),
      flowSuspensionReason: 'Importé désactivé par sécurité: configurer les connexions et variables avant activation.'
    },
    schemaVersion: '1.0.0.0'
  };
}

function buildConnectionReferences(definition) {
  const raw = JSON.stringify(definition);
  const references = {};

  if (raw.includes('shared_office365')) {
    references.shared_office365 = {
      connectionName: '{CONNECTION_OFFICE365}',
      source: 'Invoker',
      id: '/providers/Microsoft.PowerApps/apis/shared_office365',
      tier: 'Standard',
      apiName: 'office365'
    };
  }

  return references;
}

function buildWorkflowCreatePayload(clientData, spec, workflowId) {
  return {
    name: spec.displayName,
    description: spec.description,
    category: 5,
    type: 1,
    primaryentity: 'none',
    statecode: 0,
    statuscode: 1,
    clientdata: JSON.stringify(clientData),
    workflowid: workflowId
  };
}

function deterministicGuid(input) {
  const hash = createHash('sha1').update(input).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20),
    hash.slice(20, 32)
  ].join('-');
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data, 'utf8');
}

async function copyFileText(from, to) {
  const content = await readFile(from, 'utf8');
  await writeText(to, content);
}

function buildDeploymentSettings(flowRows) {
  return {
    EnvironmentVariables: [
      { SchemaName: 'ac_GRAPH_BASE_URL', Value: 'https://graph.microsoft.com/v1.0' },
      { SchemaName: 'ac_USER_ID_OR_UPN', Value: '{USER_ID_OR_UPN}' },
      { SchemaName: 'ac_TENANT_ID', Value: '{TENANT_ID}' },
      { SchemaName: 'ac_CLIENT_ID', Value: '{CLIENT_ID}' },
      { SchemaName: 'ac_DATAVERSE_ORG_URL', Value: 'https://{environment}.crm.dynamics.com' },
      { SchemaName: 'ac_TEAMS_WEBHOOK_URL', Value: '{TEAMS_WEBHOOK_URL}' },
      { SchemaName: 'ac_COPILOT_REALTIME_ENDPOINT', Value: '{COPILOT_REALTIME_ENDPOINT}' },
      { SchemaName: 'ac_COPILOT_HISTORICAL_ENDPOINT', Value: '{COPILOT_HISTORICAL_ENDPOINT}' },
      { SchemaName: 'ac_MODE_SIMULATION_HISTORIQUE', Value: 'true' },
      { SchemaName: 'ac_DEFAULT_TIMEZONE', Value: 'Europe/Paris' }
    ],
    ConnectionReferences: [
      {
        LogicalName: 'ac_sharedoffice365',
        ConnectionId: '{OFFICE365_CONNECTION_ID}',
        ConnectorId: '/providers/Microsoft.PowerApps/apis/shared_office365'
      }
    ],
    CloudFlows: flowRows.map((row) => ({
      DisplayName: row.displayName,
      WorkflowId: row.workflowId,
      ImportPayload: `power-platform/dataverse-workflows/${row.slug}.create-workflow.json`
    }))
  };
}

function buildHttpImportFile(flowRows) {
  const lines = [
    '### Créer les cloud flows Assistant Commercial via Dataverse Web API',
    '### Pré-requis: token Dataverse, tables Dataverse créées, connexions et endpoints configurés.',
    '### Les flows sont importés désactivés fonctionnellement: configurez les paramètres avant activation.',
    ''
  ];

  for (const row of flowRows) {
    lines.push(`### ${row.displayName}`);
    lines.push('POST {{DATAVERSE_ORG_URL}}/api/data/v9.2/workflows');
    lines.push('Authorization: Bearer {{DATAVERSE_ACCESS_TOKEN}}');
    lines.push('Content-Type: application/json');
    lines.push('');
    lines.push(`{{${row.slug}.create-workflow.json}}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function buildReadme(flowRows) {
  return `# Artefacts Power Platform importables

Ce dossier contient les artefacts générés depuis les workflows Markdown.

## Ce qui est importable maintenant

- \`custom-connectors/assistant-commercial-graph.yaml\` : OpenAPI importable comme connecteur personnalisé.
- \`dataverse-workflows/*.create-workflow.json\` : payloads Dataverse Web API pour créer les cloud flows.
- \`solution-workflows/Workflows/*.json\` : fichiers \`clientdata\` utilisables dans une solution source Power Platform.
- \`import/create-cloud-flows.http\` : requêtes prêtes à adapter pour poster les payloads dans Dataverse.

## Ce qui reste tenant-spécifique

- Connection references Outlook/Teams.
- URL Dataverse réelle.
- Endpoints Copilot Studio publiés.
- Connexion Teams cible ou webhook.
- Consentement admin et politiques DLP.

## Flows générés

${flowRows.map((row) => `- ${row.displayName} : \`${row.workflowId}\``).join('\n')}

## Commandes utiles

\`\`\`powershell
npm run generate:power-platform
npm test
\`\`\`

Avec PAC CLI, la voie recommandée est de créer une solution vide dans l'environnement cible, d'y ajouter ces flows après import Dataverse ou reconstruction assistée, puis de l'exporter comme solution gérée/non gérée.
`;
}

async function main() {
  const rows = [];

  for (const spec of FLOW_SPECS) {
    const workflowId = deterministicGuid(`assistant-commercial:${spec.slug}`);
    const definition = spec.buildDefinition();
    const clientData = buildClientData(definition, spec);
    const createPayload = buildWorkflowCreatePayload(clientData, spec, workflowId);

    await writeJson(join(OUT_ROOT, 'cloud-flows', spec.slug, 'workflow-definition.json'), definition);
    await writeJson(join(OUT_ROOT, 'cloud-flows', spec.slug, 'clientdata.json'), clientData);
    await writeJson(join(OUT_ROOT, 'dataverse-workflows', `${spec.slug}.create-workflow.json`), createPayload);
    await writeJson(join(OUT_ROOT, 'solution-workflows', 'Workflows', `${workflowId}.json`), clientData);

    rows.push({
      slug: spec.slug,
      displayName: spec.displayName,
      workflowId
    });
  }

  await copyFileText('graph/openapi/graph-outlook-assistant-commercial.yaml', join(OUT_ROOT, 'custom-connectors', 'assistant-commercial-graph.yaml'));
  await writeJson(join(OUT_ROOT, 'import', 'deployment-settings.template.json'), buildDeploymentSettings(rows));
  await writeText(join(OUT_ROOT, 'import', 'create-cloud-flows.http'), buildHttpImportFile(rows));
  await writeText(join(OUT_ROOT, 'README.md'), buildReadme(rows));

  console.log(`Artefacts Power Platform générés: ${rows.length} flows.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
