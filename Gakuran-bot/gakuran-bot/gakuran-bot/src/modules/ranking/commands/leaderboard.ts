import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command, GakuranClient } from '../../../client';
import { isRateLimited } from '../../../security/rateLimiter';

/**
 * Exemple de commande "type" à suivre pour tous les autres modules
 * (Objet A - Classement). Montre :
 *  - la validation des options utilisateur (zod-like via discord.js builders)
 *  - le rate limiting
 *  - l'accès sécurisé à la base via Prisma (jamais de SQL brut concaténé)
 */
const command: Command = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('classement')
    .setDescription('Affiche le classement général ou par mode de jeu')
    .addStringOption((opt) =>
      opt.setName('type').setDescription('gang ou joueur').setRequired(true).addChoices(
        { name: 'Gang', value: 'GANG' },
        { name: 'Joueur', value: 'PLAYER' },
      ),
    ),

  async execute(interaction: ChatInputCommandInteraction, client: GakuranClient) {
    if (isRateLimited(`leaderboard:${interaction.user.id}`, 5)) {
      await interaction.reply({ content: '⏳ Merci de patienter avant de réutiliser cette commande.', ephemeral: true });
      return;
    }

    const type = interaction.options.getString('type', true);
    await interaction.deferReply();

    if (type === 'PLAYER') {
      // Classement général = somme des ELO de chaque mode de jeu, par joueur
      const rankings = await client.prisma.playerRanking.groupBy({
        by: ['playerId'],
        _sum: { elo: true },
        orderBy: { _sum: { elo: 'desc' } },
        take: 10,
      });

      const players = await client.prisma.player.findMany({
        where: { id: { in: rankings.map((r) => r.playerId) } },
      });

      const lines = rankings.map((r, i) => {
        const player = players.find((p) => p.id === r.playerId);
        return `**${i + 1}.** ${player?.username ?? 'Inconnu'} — ${r._sum.elo ?? 0} ELO`;
      });

      const embed = new EmbedBuilder()
        .setTitle('🏆 Classement général — Joueurs')
        .setDescription(lines.join('\n') || 'Aucune donnée pour le moment.')
        .setColor(0xf1c40f);

      await interaction.editReply({ embeds: [embed] });
    } else {
      const rankings = await client.prisma.gangRanking.groupBy({
        by: ['gangId'],
        _sum: { elo: true },
        orderBy: { _sum: { elo: 'desc' } },
        take: 10,
      });

      const gangs = await client.prisma.gang.findMany({
        where: { id: { in: rankings.map((r) => r.gangId) } },
      });

      const lines = rankings.map((r, i) => {
        const gang = gangs.find((g) => g.id === r.gangId);
        return `**${i + 1}.** ${gang?.name ?? 'Inconnu'} — ${r._sum.elo ?? 0} ELO`;
      });

      const embed = new EmbedBuilder()
        .setTitle('🏆 Classement général — Gangs')
        .setDescription(lines.join('\n') || 'Aucune donnée pour le moment.')
        .setColor(0x3498db);

      await interaction.editReply({ embeds: [embed] });
    }
  },
};

export default command;
