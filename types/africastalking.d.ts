declare module "africastalking" {
  interface SMSSendOptions {
    to: string[];
    message: string;
    from?: string;
  }

  interface SMSService {
    send(options: SMSSendOptions): Promise<unknown>;
  }

  interface AfricasTalkingInstance {
    SMS: SMSService;
  }

  function AfricasTalking(options: { username: string; apiKey: string }): AfricasTalkingInstance;
  export = AfricasTalking;
}
