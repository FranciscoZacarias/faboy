const Command = require('../../utils/Command');

module.exports = class extends Command
{
    constructor(name, client, locale)
    {
        super(name, client, locale);
        this.aliases = ['skill'];
    }

    async run(parsed_message)
    {
        const { spawn } = require('child_process');
        const script = spawn('python',['./scripts/100.py', parsed_message.clean_message]);
        
        const chunks = [];

        script.stdout.on('data', (data) => 
        {
            chunks.push(data)
        });
        script.stdout.on('end', () => 
        {
            let output_buf = Buffer.concat(chunks)
            let base64_str = (JSON.parse(output_buf.toString())).picture;
            
            let data = new URLSearchParams();
            data.append('request', base64_str)
            this.client.fetch('https://www.base64decode.net/base64-image-decoder',{
                method: 'POST',
                body: data
            })
            .then((res => res.text()))
            .then(text =>
            {
                let html = JSON.stringify(text)
                let tag = '<img src=\\';
                let first_char = html.indexOf(tag) + tag.length + 1;
                let uri = '';
                let req = false;
                while(!req)
                {
                    if(html[first_char] == '\\')
                    {
                        req = true;
                        break;
                    }
                    uri += html[first_char++];
                }
                return parsed_message.message.channel.send(uri);
            });
        });
        script.stderr.on('data', (err) =>
        {
            this.client.logger.log(err, 'error');
        });
    }
}