#!/usr/bin/env python3
"""Generate pixel art NFT badges for BlockQuest Official"""
import asyncio
import os
import base64
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

# Badge definitions
BADGES = [
    # Level Badges
    {
        "id": "level_5",
        "name": "Rising Star",
        "prompt": "Pixel art badge icon, 8-bit retro style, golden star with cyan glow effect on dark purple background, game achievement badge, simple clean design, 64x64 pixels style",
    },
    {
        "id": "level_10", 
        "name": "Chain Champion",
        "prompt": "Pixel art badge icon, 8-bit retro style, golden trophy with blockchain chain links, cyan and magenta neon glow on dark background, game achievement badge, 64x64 pixels style",
    },
    {
        "id": "level_25",
        "name": "Block Legend",
        "prompt": "Pixel art badge icon, 8-bit retro style, golden crown with purple gemstones, neon pink and cyan accents, dark background, legendary game badge, 64x64 pixels style",
    },
    {
        "id": "level_50",
        "name": "Blockchain Master",
        "prompt": "Pixel art badge icon, 8-bit retro style, diamond crystal with golden blockchain symbol, rainbow neon glow, dark purple background, epic game badge, 64x64 pixels style",
    },
    {
        "id": "level_100",
        "name": "Genesis Guardian",
        "prompt": "Pixel art badge icon, 8-bit retro style, majestic trident with golden orb, cosmic purple and gold colors, legendary aura glow, dark space background, ultimate game badge, 64x64 pixels style",
    },
    
    # Game Badges
    {
        "id": "block_muncher",
        "name": "Block Collector",
        "prompt": "Pixel art badge icon, 8-bit retro style, cute pac-man style character eating golden blocks, yellow and cyan colors, dark background, arcade game badge, 64x64 pixels style",
    },
    {
        "id": "chain_invaders",
        "name": "Alien Hunter",
        "prompt": "Pixel art badge icon, 8-bit retro style, space invader alien with targeting reticle, green and cyan neon colors, starry dark background, arcade shooter badge, 64x64 pixels style",
    },
    {
        "id": "token_tumble",
        "name": "Token Stacker",
        "prompt": "Pixel art badge icon, 8-bit retro style, colorful tetris blocks stacked perfectly, cyan magenta yellow blocks, dark background with glow, puzzle game badge, 64x64 pixels style",
    },
    {
        "id": "crypto_climber",
        "name": "NFT Collector",
        "prompt": "Pixel art badge icon, 8-bit retro style, golden egg with sparkles on ladder, brown and gold colors, dark background, climbing game badge, 64x64 pixels style",
    },
    {
        "id": "hash_hopper",
        "name": "Perfect Hash",
        "prompt": "Pixel art badge icon, 8-bit retro style, cute frog on lily pad with hash symbol, green and cyan colors, pond dark background, arcade hopper badge, 64x64 pixels style",
    },
    {
        "id": "seed_sprint",
        "name": "Seed Guardian",
        "prompt": "Pixel art badge icon, 8-bit retro style, running character with 12 glowing word fragments, red and yellow speed lines, dark background, runner game badge, 64x64 pixels style",
    },
    
    # Special Badges
    {
        "id": "plays_5",
        "name": "Arcade Rookie",
        "prompt": "Pixel art badge icon, 8-bit retro style, classic joystick controller with star, cyan and white colors, dark arcade background, beginner badge, 64x64 pixels style",
    },
    {
        "id": "plays_100",
        "name": "Arcade Addict",
        "prompt": "Pixel art badge icon, 8-bit retro style, retro arcade cabinet with coins, neon pink and cyan glow, dark background, dedicated player badge, 64x64 pixels style",
    },
    {
        "id": "bqo_holder",
        "name": "BQO Holder",
        "prompt": "Pixel art badge icon, 8-bit retro style, golden coin with B symbol and blockchain pattern, gold and cyan colors, dark background with sparkles, crypto token badge, 64x64 pixels style",
    },
    {
        "id": "nft_collector",
        "name": "NFT Master",
        "prompt": "Pixel art badge icon, 8-bit retro style, sparkling diamond gem with NFT text, rainbow colors on dark purple background, rare collector badge, 64x64 pixels style",
    },
    {
        "id": "network_guardian",
        "name": "Network Guardian",
        "prompt": "Pixel art badge icon, 8-bit retro style, shield with network nodes connected by lines, cyan and gold colors, dark tech background, defender badge, 64x64 pixels style",
    },
]

async def generate_badges():
    """Generate all badge images"""
    api_key = "sk-emergent-a72F1F7180a1f3fC5E"
    output_dir = "/app/frontend/assets/badges"
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    image_gen = OpenAIImageGeneration(api_key=api_key)
    
    generated = []
    failed = []
    
    for badge in BADGES:
        print(f"Generating: {badge['name']}...")
        try:
            images = await image_gen.generate_images(
                prompt=badge['prompt'],
                model="gpt-image-1",
                number_of_images=1
            )
            
            if images and len(images) > 0:
                filepath = f"{output_dir}/{badge['id']}.png"
                with open(filepath, "wb") as f:
                    f.write(images[0])
                print(f"  ✅ Saved: {filepath}")
                generated.append(badge['id'])
            else:
                print("  ❌ No image generated")
                failed.append(badge['id'])
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
            failed.append(badge['id'])
    
    print("\n=== SUMMARY ===")
    print(f"Generated: {len(generated)}")
    print(f"Failed: {len(failed)}")
    if failed:
        print(f"Failed badges: {failed}")
    
    return generated, failed

if __name__ == "__main__":
    asyncio.run(generate_badges())
