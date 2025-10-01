# bnup/backends.py
import smtplib
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend

class SMTPNoKeyfileBackend(DjangoEmailBackend):
    """
    Backend SMTP que ignora keyfile/certfile para compatibilidad con Python 3.12.
    """

    def open(self):
        if self.connection:
            return False

        try:
            if self.use_ssl:
                # NO pasar keyfile/certfile como kwargs
                self.connection = smtplib.SMTP_SSL(self.host, self.port, timeout=self.timeout)
            else:
                self.connection = smtplib.SMTP(self.host, self.port, timeout=self.timeout)
                self.connection.ehlo()
                if self.use_tls:
                    # NO pasar keyfile/certfile como kwargs
                    self.connection.starttls()
                    self.connection.ehlo()

            if self.username and self.password:
                self.connection.login(self.username, self.password)
            return True
        except Exception:
            self.close()
            raise
