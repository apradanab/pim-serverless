import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

interface EmailConfig {
  region: string;
  sourceEmail: string;
}

export class EmailService {
  private ses: SESClient;

  constructor(private config: EmailConfig) {
    this.ses = new SESClient({ region: this.config.region });
  }

  async sendApprovalEmail(to: string, name: string, token: string) {
    const domain = process.env.APP_DOMAIN || 'http://localhost:3000';
    const link = `${domain}/complete-register?token=${token}`;

    const params: SendEmailCommandInput = {
      Source: this.config.sourceEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: 'Tu cuenta ha sido aprobada' },
        Body: {
          Html: {
            Data: `
              <h1>Hola ${name}</h1>
              <p>Tu cuenta ha sido aprobada. Haz click para completar tu registro:</p>
              <a href="${link}">Completar Registro</a>
              <p>Este link expira en 24 horas.</p>
            `
          }
        }
      }
    };

    await this.ses.send(new SendEmailCommand(params));
  }
}
