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

  private formatDateES = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  async sendApprovalEmail(to: string, name: string, token: string) {
    const domain = process.env.APP_DOMAIN || 'http://localhost:4200';
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

  async sendAppointmentConfirmation(
    to: string,
    userName: string,
    therapyTitle: string,
    appointmentDate: string,
    appointmentTime: string,
  ) {
    const formattedDate = this.formatDateES(appointmentDate);

    const params: SendEmailCommandInput = {
      Source: this.config.sourceEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: `Confirmación de cita - ${therapyTitle}` },
        Body: {
          Html: {
            Data: `
              <h1>Confirmación de Cita</h1>
              <p>Hola ${userName},</p>
              <p>Tu cita para <strong>${therapyTitle}</strong> ha sido confirmada.</p>
              <p><strong>Fecha:</strong> ${formattedDate}</p>
              <p><strong>Hora:</strong> ${appointmentTime}</p>
              <p>Te esperamos en nuestro centro.</p>
            `
          }
        }
      }
    };
    await this.ses.send(new SendEmailCommand(params));
  }

  async sendAppointmentCancellation(
    to: string,
    userName: string,
    therapyTitle: string,
    appointmentDate: string,
    appointmentTime: string,
    cancellationReason?: string
  ) {
    const formattedDate = this.formatDateES(appointmentDate);

    const params: SendEmailCommandInput = {
      Source: this.config.sourceEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: `Cancelación de cita - ${therapyTitle}` },
        Body: {
          Html: {
            Data: `
              <h1>Cancelación de Cita</h1>
              <p>Hola ${userName},</p>
              <p>Tu cita para <strong>${therapyTitle}</strong> ha sido cancelada.</p>
              <p><strong>Fecha:</strong> ${formattedDate}</p>
              <p><strong>Hora:</strong> ${appointmentTime}</p>
              ${cancellationReason ? `<p><strong>Motivo:</strong> ${cancellationReason}</p>` : ''}
              <p>Puedes agendar una nueva cita cuando lo desees.</p>
            `
          }
        }
      }
    };
    await this.ses.send(new SendEmailCommand(params));
  }
}
